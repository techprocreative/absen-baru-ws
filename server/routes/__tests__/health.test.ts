import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import * as dbModule from '../../db';
import * as modelValidator from '../../utils/validateModels';

describe('Health Routes', () => {
  beforeEach(() => {
    vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValue(true);
    vi.spyOn(modelValidator, 'validateModels').mockReturnValue({ valid: true, missing: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('responds to /api/ping', async () => {
    const response = await request(app).get('/api/ping');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('reports healthy status when dependencies pass', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.checks.database).toBe(true);
    expect(response.headers).toHaveProperty('x-response-time');
  });

  it('flags unhealthy when database check fails', async () => {
    vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValueOnce(false);
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unhealthy');
  });

  it('reports readiness when all checks succeed', async () => {
    const response = await request(app).get('/api/ready');
    expect(response.status).toBe(200);
    expect(response.body.ready).toBe(true);
  });

  it('returns 503 for readiness when models invalid', async () => {
    vi.spyOn(modelValidator, 'validateModels').mockReturnValueOnce({ valid: false, missing: ['file'] });
    const response = await request(app).get('/api/ready');
    expect(response.status).toBe(503);
    expect(response.body.ready).toBe(false);
  });

  it('responds to /api/live', async () => {
    const response = await request(app).get('/api/live');
    expect(response.status).toBe(200);
    expect(response.body.alive).toBe(true);
  });
});
