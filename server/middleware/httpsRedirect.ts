import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function httpsRedirect(req: Request, res: Response, next: NextFunction) {
  if (config.NODE_ENV !== 'production') {
    return next();
  }

  const forwardedProto = req.get('x-forwarded-proto');
  const isSecure = req.secure || forwardedProto === 'https';

  if (!isSecure && req.hostname) {
    return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
  }

  next();
}
