import cron from 'node-cron';
import { storage } from '../storage';
import { logger } from '../logger';

// Run cleanup daily at 2 AM
export function startCleanupJob() {
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting scheduled cleanup of expired guest records');
      
      const deletedCount = await storage.cleanupExpiredGuests();
      
      logger.info(`Cleanup completed: ${deletedCount} expired guest records removed`);
    } catch (error) {
      logger.error('Cleanup job failed:', error);
    }
  });
  
  logger.info('Cleanup job scheduled: Daily at 2:00 AM');
}