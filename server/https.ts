import http from 'http';
import https from 'https';
import fs from 'fs';
import type { Express } from 'express';
import { logger } from './logger';
import { config } from './config';

export type NodeServer = http.Server | https.Server;

export function createAppServer(app: Express): NodeServer {
  if (config.NODE_ENV === 'production') {
    const { SSL_CERT_PATH, SSL_KEY_PATH } = config;

    if (!SSL_CERT_PATH || !SSL_KEY_PATH) {
      logger.error('SSL certificates not configured. Set SSL_CERT_PATH and SSL_KEY_PATH.');
      process.exit(1);
    }

    if (!fs.existsSync(SSL_CERT_PATH) || !fs.existsSync(SSL_KEY_PATH)) {
      logger.error('SSL certificate files not found.', {
        cert: SSL_CERT_PATH,
        key: SSL_KEY_PATH,
      });
      process.exit(1);
    }

    const options: https.ServerOptions = {
      cert: fs.readFileSync(SSL_CERT_PATH),
      key: fs.readFileSync(SSL_KEY_PATH),
      minVersion: 'TLSv1.2',
      ciphers: [
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
      ].join(':'),
    };

    logger.info('Creating HTTPS server');
    return https.createServer(options, app);
  }

  logger.info('Creating HTTP server (non-production)');
  return http.createServer(app);
}
