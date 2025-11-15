import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import crypto from 'crypto';
import { pool } from './db';
import { config } from './config';

const PgSession = connectPgSimple(session as any);

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60,
  }),
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: 'facesense.sid',
  cookie: {
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict',
    domain: config.NODE_ENV === 'production' ? config.SESSION_COOKIE_DOMAIN : undefined,
  },
  genid: () => crypto.randomBytes(32).toString('hex'),
});

export function regenerateSession(req: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingData = { ...req.session };
    req.session.regenerate((err: unknown) => {
      if (err) {
        return reject(err);
      }
      Object.assign(req.session, existingData);
      resolve();
    });
  });
}