import http from 'http';
import https from 'https';
import fs from 'fs';
import type { Express } from 'express';
import { logger } from './logger.js';
import { config } from './config.js';

export type NodeServer = http.Server | https.Server;

export function createAppServer(app: Express): NodeServer {
  if (config.NODE_ENV === 'production') {
    const { SSL_CERT_PATH, SSL_KEY_PATH } = config;

    // Only use HTTPS with custom certificates if both paths are provided
    // In cloud platforms like Render, SSL is handled by the platform
    if (SSL_CERT_PATH && SSL_KEY_PATH) {
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

      logger.info('Creating HTTPS server with custom certificates');
      return https.createServer(options, app);
    }

    // In production without custom SSL certs (e.g., Render, Heroku)
    // Use HTTP server - the platform handles SSL termination
    logger.info('Creating HTTP server (SSL handled by platform)');
    return http.createServer(app);
  }

  logger.info('Creating HTTP server (development)');
  return http.createServer(app);
}
