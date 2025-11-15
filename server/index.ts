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

const app = express();
app.set('trust proxy', 1);

// Export app for testing
export { app };

// Enforce HTTPS in production
app.use(httpsRedirect);

// Security middleware (harus paling awal)
setupSecurityMiddleware(app);

// Body parsers
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

// Session management
app.use(sessionMiddleware);

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(globalLimiter);
app.use('/api', apiLimiter);

// Health routes
app.use('/api', healthRouter);

// Start scheduled cleanup job (production only)
if (config.NODE_ENV === 'production') {
  startCleanupJob();
}

(async () => {
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
