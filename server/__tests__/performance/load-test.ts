import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../index';

describe('Performance & Load Tests', () => {
  describe('API Response Times', () => {
    it('should respond to status check within 100ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/guests/status')
        .set('Authorization', 'Bearer test-token');
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 50;
      const start = Date.now();

      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() =>
          request(app)
            .get('/api/guests/status')
            .set('Authorization', 'Bearer test-token')
        );

      await Promise.all(promises);
      
      const duration = Date.now() - start;
      const avgTime = duration / concurrentRequests;

      expect(avgTime).toBeLessThan(200); // Average should be under 200ms
    });
  });

  describe('Database Query Performance', () => {
    it('should retrieve guest status efficiently', async () => {
      // Test database query performance
      // This would need a valid token from actual enrollment
      const start = Date.now();
      
      await request(app)
        .get('/api/guests/status')
        .set('Authorization', 'Bearer test-token');
      
      const duration = Date.now() - start;
      
      // Should complete within reasonable time even with database query
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during enrollment', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform multiple enrollments
      const mockFaceImages = Array(5).fill('data:image/png;base64,test');
      
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/guests/enroll')
          .send({
            name: `Memory Test ${i}`,
            email: `memtest${i}@test.com`,
            purpose: 'Memory leak testing',
            consent: true,
            faceImages: mockFaceImages,
          });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be reasonable (< 50MB for 10 enrollments)
      expect(memoryIncrease).toBeLessThan(50);
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should handle rate limiting efficiently', async () => {
      const start = Date.now();
      const mockFaceImages = Array(5).fill('data:image/png;base64,test');
      
      // Send requests up to rate limit
      const requests = Array(5).fill(null).map((_, i) =>
        request(app)
          .post('/api/guests/enroll')
          .send({
            name: `Rate Test ${i}`,
            email: `ratetest${i}@perf.com`,
            purpose: 'Rate limit performance testing',
            consent: true,
            faceImages: mockFaceImages,
          })
      );

      await Promise.all(requests);
      const duration = Date.now() - start;

      // Rate limiting should not significantly slow down valid requests
      expect(duration / requests.length).toBeLessThan(300);
    });
  });

  describe('Payload Size Handling', () => {
    it('should handle large face image payloads efficiently', async () => {
      const start = Date.now();
      
      // Create larger mock images (simulating real base64 images)
      const largeMockImage = 'data:image/png;base64,' + 'A'.repeat(10000);
      const mockFaceImages = Array(5).fill(largeMockImage);
      
      await request(app)
        .post('/api/guests/enroll')
        .send({
          name: 'Large Payload Test',
          email: 'largepayload@test.com',
          purpose: 'Testing large payload handling',
          consent: true,
          faceImages: mockFaceImages,
        });

      const duration = Date.now() - start;
      
      // Should handle larger payloads within reasonable time
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle mixed operations concurrently', async () => {
      const start = Date.now();
      const mockFaceImages = Array(5).fill('data:image/png;base64,test');
      
      // Mix of different operations
      const operations = [
        // Enrollments
        request(app).post('/api/guests/enroll').send({
          name: 'Concurrent Test 1',
          email: 'concurrent1@test.com',
          purpose: 'Concurrent testing',
          consent: true,
          faceImages: mockFaceImages,
        }),
        request(app).post('/api/guests/enroll').send({
          name: 'Concurrent Test 2',
          email: 'concurrent2@test.com',
          purpose: 'Concurrent testing',
          consent: true,
          faceImages: mockFaceImages,
        }),
        // Status checks
        request(app).get('/api/guests/status').set('Authorization', 'Bearer test-token'),
        request(app).get('/api/guests/status').set('Authorization', 'Bearer test-token'),
        // Health check
        request(app).get('/api/health'),
      ];

      await Promise.all(operations);
      const duration = Date.now() - start;

      // All operations should complete within reasonable time
      expect(duration).toBeLessThan(3000);
    });
  });
});