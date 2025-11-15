import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './errorHandler.js';

function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000);
}

function sanitizeObject(input: unknown): unknown {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeObject);
  }

  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (key === 'faceImage' || key === 'faceImages') {
        sanitized[key] = value;
        continue;
      }
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return input;
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export function validateBase64Image(base64String: string): void {
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

  let mimeType = 'image/jpeg';
  let base64Data = base64String;

  if (matches) {
    mimeType = matches[1];
    base64Data = matches[2];
  } else if (!/^[A-Za-z0-9+/=]+$/.test(base64String)) {
    throw new AppError(400, 'INVALID_IMAGE', 'Invalid image format');
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new AppError(400, 'INVALID_IMAGE_TYPE', 'Image must be JPEG or PNG');
  }

  const size = Math.ceil((base64Data.length * 3) / 4);
  if (size > MAX_IMAGE_SIZE) {
    throw new AppError(400, 'IMAGE_TOO_LARGE', 'Image size exceeds 5MB');
  }
}

export function validateImagesArray(fieldName = 'faceImages') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const images = req.body[fieldName];

      if (!Array.isArray(images) || images.length < 5 || images.length > 10) {
        throw new AppError(400, 'INVALID_IMAGES_COUNT', 'Require 5-10 images');
      }

      for (const image of images) {
        validateBase64Image(image);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
