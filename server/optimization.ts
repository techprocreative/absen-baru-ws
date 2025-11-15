/**
 * Performance Optimization Configurations
 */

import compression from 'compression';
import { Express } from 'express';

export function applyOptimizations(app: Express) {
  // Enable gzip compression
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Compression level (0-9)
  }));

  // Disable unnecessary headers
  app.disable('x-powered-by');

  // Enable trust proxy for accurate IP addresses behind load balancer
  app.set('trust proxy', 1);

  // Set cache headers for static assets
  app.use('/models', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    next();
  });
}

export const performanceConfig = {
  // Database connection pool
  database: {
    maxConnections: 20,
    idleTimeout: 30000, // 30 seconds
    connectionTimeout: 5000, // 5 seconds
  },

  // Face recognition optimization
  faceRecognition: {
    maxConcurrent: 5, // Maximum concurrent face processing
    timeout: 10000, // 10 seconds per operation
  },

  // Session optimization
  session: {
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiry on each request
  },

  // Rate limiting optimization
  rateLimiting: {
    windowMs: 60 * 60 * 1000, // 1 hour
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Response compression
  compression: {
    threshold: 1024, // Only compress responses > 1KB
    level: 6, // Balance between speed and compression ratio
  },

  // Request timeout
  timeout: {
    server: 30000, // 30 seconds
    keepAlive: 65000, // 65 seconds (should be > server timeout)
  },

  // Payload limits
  payload: {
    json: '10mb', // Maximum JSON payload size
    urlencoded: '10mb', // Maximum URL-encoded payload size
  },

  // Static file caching
  staticFiles: {
    maxAge: '1y', // Cache duration for static files
    immutable: true, // Mark as immutable for better caching
  },
};

/**
 * Apply all optimizations to Express app
 */
export function setupOptimizations(app: Express): void {
  applyOptimizations(app);
  
  // Log optimization settings in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Performance optimizations applied:');
    console.log('- Compression enabled');
    console.log('- Static file caching configured');
    console.log('- Trust proxy enabled');
    console.log('- Security headers configured');
  }
}