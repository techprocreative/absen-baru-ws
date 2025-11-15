import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../logger.js';

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const isDevelopment = process.env.NODE_ENV !== 'production';

const standardHandler = (req: Request, res: Response, message: string) => {
  logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
  res.status(429).json({
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message,
  });
};

const noopLimiter = (_req: Request, _res: Response, next: NextFunction) => next();
const createLimiter = (options: Parameters<typeof rateLimit>[0]) =>
  isTestEnv ? noopLimiter : rateLimit(options);

export const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 1000 : 100, // 1000 in dev, 100 in prod
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => standardHandler(req, res, 'Too many requests, please try again later'),
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 100 : 5, // 100 in dev, 5 in prod
  skipSuccessfulRequests: true,
  handler: (req, res) => standardHandler(req, res, 'Too many login attempts. Please try again later'),
});

export const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: isDevelopment ? 1000 : 60, // 1000 in dev, 60 in prod
  handler: (req, res) => standardHandler(req, res, 'API rate limit exceeded'),
});

export const faceRecognitionLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: isDevelopment ? 1000 : 10, // 1000 in dev, 10 in prod
  handler: (req, res) => standardHandler(req, res, 'Too many face recognition requests. Please slow down.'),
});

export const enrollmentLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: isDevelopment ? 100 : 3, // 100 in dev, 3 in prod
  handler: (req, res) => standardHandler(req, res, 'Enrollment limit reached. Try again later.'),
});
