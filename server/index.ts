import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { config } from "./config";
import { logger } from "./logger";
import { sessionMiddleware } from "./session";
import { setupSecurityMiddleware } from "./middleware/security";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { startCleanupJob } from "./jobs/cleanup";
import { loadFaceApiModels } from "./utils/faceRecognition";
import { validateModels } from "./utils/validateModels";
import { closeDatabaseConnection } from "./db";
import { httpsRedirect } from "./middleware/httpsRedirect";
import { globalLimiter, apiLimiter } from "./middleware/rateLimiting";
import { createAppServer } from "./https";
import healthRouter from "./routes/health";

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
    logger.error('❌ Missing face recognition models', { missing: modelCheck.missing });
    logger.error('Run "npm run download-models" before starting the server.');
    process.exit(1);
  }

  logger.info('✅ Face recognition model files verified');

  // Load face recognition models on startup
  logger.info('Initializing face recognition models...');
  try {
    await loadFaceApiModels();
    logger.info('Face recognition models ready');
  } catch (error) {
    logger.error('Failed to load face recognition models:', error);
    logger.error('Server cannot start without face recognition capabilities. Exiting.');
    process.exit(1);
  }

  // API routes
  await registerRoutes(app);

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
