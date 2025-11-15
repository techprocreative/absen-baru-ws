import helmet from 'helmet';
import type { Express } from 'express';
import { config } from '../config.js';

export function setupSecurityMiddleware(app: Express) {
  app.disable('x-powered-by');

  const isDevelopment = process.env.NODE_ENV !== 'production';

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: isDevelopment
          ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]  // Vite needs these in dev
          : ["'self'"],                                      // Strict in production
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  const allowedOrigins = Array.isArray(config.ALLOWED_ORIGINS)
    ? config.ALLOWED_ORIGINS
    : [config.ALLOWED_ORIGINS];

  app.use((req, res, next) => {
    const origin = req.get('origin');

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });
}