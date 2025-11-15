import { describe, it, expect, vi } from 'vitest';
import { validateBase64Image, validateImagesArray } from '../../middleware/validation';
import { AppError } from '../../middleware/errorHandler';

const VALID_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const INVALID_PREFIX_IMAGE = 'not-a-base64-image';
const INVALID_TYPE_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAP';

describe('validateBase64Image', () => {
  it('accepts valid PNG under size limit', () => {
    expect(() => validateBase64Image(VALID_IMAGE)).not.toThrow();
  });

  it('rejects malformed base64 payloads', () => {
    expect(() => validateBase64Image(INVALID_PREFIX_IMAGE)).toThrow(AppError);
  });

  it('rejects unsupported mime types', () => {
    expect(() => validateBase64Image(INVALID_TYPE_IMAGE)).toThrow(AppError);
  });

  it('rejects images larger than 5MB', () => {
    const hugePayload = 'data:image/jpeg;base64,' + 'A'.repeat(8 * 1024 * 1024);
    expect(() => validateBase64Image(hugePayload)).toThrow(AppError);
  });
});

describe('validateImagesArray middleware', () => {
  const runMiddleware = async (images: string[]) => {
    const middleware = validateImagesArray();
    const req: any = { body: { faceImages: images } };
    const res: any = {};
    const next = vi.fn();

    await middleware(req, res, next);
    return next;
  };

  it('passes when 5 valid images are provided', async () => {
    const images = Array(5).fill(VALID_IMAGE);
    const next = await runMiddleware(images);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toEqual([]);
  });

  it('fails when fewer than 5 images are provided', async () => {
    const next = await runMiddleware([VALID_IMAGE, VALID_IMAGE]);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('fails when an image has invalid format', async () => {
    const images = [VALID_IMAGE, VALID_IMAGE, VALID_IMAGE, VALID_IMAGE, INVALID_TYPE_IMAGE];
    const next = await runMiddleware(images);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });
});
