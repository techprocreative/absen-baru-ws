console.log('[INDEX] Starting imports...');
import express from "express";
console.log('[INDEX] express imported');
import { registerRoutes } from "./routes.js";
console.log('[INDEX] routes imported');
import { setupVite, serveStatic } from "./vite.js";
console.log('[INDEX] vite imported');
import { config } from "./config.js";
console.log('[INDEX] config imported');
import { logger } from "./logger.js";
console.log('[INDEX] logger imported');
import { sessionMiddleware } from "./session.js";
console.log('[INDEX] session imported');
import { setupSecurityMiddleware } from "./middleware/security.js";
console.log('[INDEX] security imported');
import { requestLogger } from "./middleware/requestLogger.js";
console.log('[INDEX] requestLogger imported');
import { errorHandler } from "./middleware/errorHandler.js";
console.log('[INDEX] errorHandler imported');
import { startCleanupJob } from "./jobs/cleanup.js";
console.log('[INDEX] cleanup imported');
import { loadFaceApiModels } from "./utils/faceRecognition.js";
console.log('[INDEX] faceRecognition imported');
import { validateModels } from "./utils/validateModels.js";
console.log('[INDEX] validateModels imported');
import { closeDatabaseConnection } from "./db.js";
console.log('[INDEX] db imported');
import { httpsRedirect } from "./middleware/httpsRedirect.js";
console.log('[INDEX] httpsRedirect imported');
import { globalLimiter, apiLimiter } from "./middleware/rateLimiting.js";
console.log('[INDEX] rateLimiting imported');
import { createAppServer } from "./https.js";
console.log('[INDEX] https imported');
import healthRouter from "./routes/health.js";
console.log('[INDEX] healthRouter imported');
console.log('[INDEX] All imports complete!');

console.log('[INDEX] Creating Express app...');
const app = express();
console.log('[INDEX] Express app created');
app.set('trust proxy', 1);
console.log('[INDEX] Trust proxy set');

// Export app for testing
export { app };

// Enforce HTTPS in production
console.log('[INDEX] Setting up HTTPS redirect...');
app.use(httpsRedirect);
console.log('[INDEX] HTTPS redirect set');

// Security middleware (harus paling awal)
console.log('[INDEX] Setting up security middleware...');
setupSecurityMiddleware(app);
console.log('[INDEX] Security middleware set');

// Body parsers
console.log('[INDEX] Setting up body parsers...');
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({ 
  limit: '10mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
console.log('[INDEX] Body parsers set');

// Session management
console.log('[INDEX] Setting up session...');
app.use(sessionMiddleware);
console.log('[INDEX] Session set');

// Request logging
console.log('[INDEX] Setting up request logger...');
app.use(requestLogger);
console.log('[INDEX] Request logger set');

// Rate limiting
console.log('[INDEX] Setting up rate limiting...');
app.use(globalLimiter);
console.log('[INDEX] Global limiter set');
app.use('/api', apiLimiter);
console.log('[INDEX] API limiter set');

// Health routes
console.log('[INDEX] Setting up health routes...');
app.use('/api', healthRouter);
console.log('[INDEX] Health routes set');

// Start scheduled cleanup job (production only)
console.log('[INDEX] Checking cleanup job...');
if (config.NODE_ENV === 'production') {
  console.log('[INDEX] Starting cleanup job...');
  startCleanupJob();
  console.log('[INDEX] Cleanup job started');
}
console.log('[INDEX] Cleanup job check complete');

console.log('[INDEX] Starting async initialization...');
(async () => {
  console.log('[INDEX] Inside async IIFE');
  const modelCheck = validateModels();
  if (!modelCheck.valid) {
    logger.warn('⚠️ Missing face recognition models', { missing: modelCheck.missing });
    logger.warn('Face recognition features will be disabled until models are loaded.');
  } else {
    logger.info('✅ Face recognition model files verified');
  }

  // API routes
  await registerRoutes(app);

  // Load face recognition models asynchronously after server starts
  if (modelCheck.valid) {
    logger.info('Initializing face recognition models in background...');
    loadFaceApiModels()
      .then(() => {
        logger.info('✅ Face recognition models ready');
      })
      .catch((error) => {
        logger.error('Failed to load face recognition models:', error);
        logger.warn('Face recognition features will be unavailable.');
      });
  }

  const server = createAppServer(app);

  // Setup vite or static serving
  if (config.NODE_ENV === "development") {
    await setupVite(app, server);
  } else if (config.NODE_ENV === 'production') {
    serveStatic(app);
  }

  // Error handling (harus paling akhir)
  app.use(errorHandler);

  if (config.NODE_ENV !== 'test') {
    const PORT = config.PORT;
    server.listen({
      port: PORT,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      logger.info(`Server running on port ${PORT} in ${config.NODE_ENV} mode`);
    });
  } else {
    logger.info('Server initialized in test mode');
  }
})();

const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await closeDatabaseConnection();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
