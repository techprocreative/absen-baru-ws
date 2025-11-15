/**
 * Vitest Setup File
 * Runs before all tests
 */

import { beforeAll, afterAll, vi } from 'vitest';
import { config } from '../config';

// Set test environment variables
beforeAll(() => {
  // Override config for testing
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/facesense_test';
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  
  // Suppress console output during tests unless debugging
  if (!process.env.DEBUG) {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Keep console.error for debugging test failures
  }
});

afterAll(() => {
  // Restore console
  vi.restoreAllMocks();
});

// Increase timeout for integration tests
vi.setConfig({ testTimeout: 30000 });

// Mock face-api.js for testing (optional - can be overridden in specific tests)
vi.mock('face-api.js', () => ({
  env: {
    monkeyPatch: vi.fn(),
  },
  nets: {
    ssdMobilenetv1: {
      loadFromDisk: vi.fn().mockResolvedValue(undefined),
    },
    faceLandmark68Net: {
      loadFromDisk: vi.fn().mockResolvedValue(undefined),
    },
    faceRecognitionNet: {
      loadFromDisk: vi.fn().mockResolvedValue(undefined),
    },
  },
  detectSingleFace: vi.fn().mockReturnValue({
    withFaceLandmarks: vi.fn().mockReturnValue({
      withFaceDescriptor: vi.fn().mockResolvedValue({
        detection: { box: { x: 0, y: 0, width: 100, height: 100 } },
        descriptor: new Float32Array(128).fill(0.5),
      }),
    }),
  }),
  euclideanDistance: vi.fn().mockReturnValue(0.3), // Mock similarity
}));