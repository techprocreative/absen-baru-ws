import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

if (isTestEnv) {
  process.env.SESSION_SECRET = process.env.SESSION_SECRET && /^[a-f0-9]{64}$/i.test(process.env.SESSION_SECRET)
    ? process.env.SESSION_SECRET
    : 'a'.repeat(64);
  process.env.JWT_SECRET = process.env.JWT_SECRET && /^[a-f0-9]{64}$/i.test(process.env.JWT_SECRET)
    ? process.env.JWT_SECRET
    : 'b'.repeat(64);
  process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length === 32
    ? process.env.ENCRYPTION_KEY
    : 'c'.repeat(32);
}

const hex64 = /^[a-f0-9]{64}$/i;

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string()
    .min(64, 'SESSION_SECRET must be at least 64 characters')
    .regex(hex64, 'SESSION_SECRET must be 64 hex characters'),
  JWT_SECRET: z.string()
    .min(64, 'JWT_SECRET must be at least 64 characters')
    .regex(hex64, 'JWT_SECRET must be 64 hex characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  ALLOWED_ORIGINS: z.string().transform((s) =>
    s.split(',').map(origin => origin.trim()).filter(Boolean)
  ).default('http://localhost:5000'),
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),
  ENCRYPTION_KEY: z.string().length(32, 'ENCRYPTION_KEY must be exactly 32 characters').optional(),
  LOG_DIR: z.string().default('logs'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;