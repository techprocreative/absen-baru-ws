import { Router } from 'express';
import os from 'os';
import { checkDatabaseHealth } from '../db.js';
import { validateModels } from '../utils/validateModels.js';
import { logger } from '../logger.js';

const router = Router();

router.get('/ping', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/health', async (_req, res) => {
  try {
    const start = Date.now();
    
    // For Render health checks, return 200 immediately
    // Database check happens in background for monitoring
    const modelCheck = validateModels();
    const memUsage = process.memoryUsage();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'checking',
        models: modelCheck.valid,
        memory: {
          used: memUsage.heapUsed,
          rss: memUsage.rss,
          total: os.totalmem(),
          free: os.freemem(),
        },
      },
    };

    res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
    res.status(200).json(health);
    
    // Check database in background for monitoring
    checkDatabaseHealth().then(dbHealthy => {
      if (!dbHealthy) {
        logger.warn('Database health check failed in background');
      }
    }).catch(err => {
      logger.error('Database health check error:', err);
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(200).json({
      status: 'healthy',
      error: 'Partial check',
    });
  }
});

router.get('/ready', async (_req, res) => {
  const ready = await checkDatabaseHealth() && validateModels().valid;
  res.status(ready ? 200 : 503).json({ ready });
});

router.get('/live', (_req, res) => {
  res.status(200).json({ alive: true });
});

export default router;
