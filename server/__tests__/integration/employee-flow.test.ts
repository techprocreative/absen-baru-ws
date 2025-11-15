import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../../index';
import { db } from '../../db';
import { attendance, departments, users } from '../../../shared/schema';

const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegrationTests ? describe : describe.skip;

describeIntegration('Employee Attendance Flow - Integration Tests', () => {
  const testSuffix = Date.now();
  const testEmail = `employee.integration+${testSuffix}@example.com`;
  const testPassword = 'StrongPass!123';
  const employeeId = `INT-${testSuffix}`;
  let departmentId: string;
  let userId: string;

  const loginAndGetToken = async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    return response.body.token as string;
  };

  beforeAll(async () => {
    const [dept] = await db.insert(departments).values({
      name: `QA Dept ${testSuffix}`,
      description: 'Integration Test Department',
    }).returning();
    departmentId = dept.id;

    const [user] = await db.insert(users).values({
      email: testEmail,
      password: testPassword,
      name: 'Integration Employee',
      employeeId,
      role: 'employee',
      status: 'active',
      departmentId,
      joinDate: new Date().toISOString().split('T')[0],
    }).returning();
    userId = user.id;
  });

  beforeEach(async () => {
    await db.delete(attendance).where(eq(attendance.userId, userId));
  });

  afterAll(async () => {
    await db.delete(attendance).where(eq(attendance.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(departments).where(eq(departments.id, departmentId));
  });

  it('logs in employee with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(testEmail);
    expect(response.body.user.role).toBe('employee');
    expect(response.body.token).toBeDefined();
  });

  it('allows employee to check in once per day', async () => {
    const token = await loginAndGetToken();

    const firstCheckIn = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(firstCheckIn.status).toBe(201);
    expect(firstCheckIn.body.userId).toBe(userId);

    const duplicateCheckIn = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(duplicateCheckIn.status).toBe(400);
    expect(duplicateCheckIn.body.error).toMatch(/Already checked in/i);
  });

  it('prevents check-out without prior check-in', async () => {
    const token = await loginAndGetToken();

    const response = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/No check-in/i);
  });

  it('allows check-out after successful check-in', async () => {
    const token = await loginAndGetToken();

    const checkInResponse = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(checkInResponse.status).toBe(201);

    const checkOutResponse = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(checkOutResponse.status).toBe(200);
    expect(checkOutResponse.body.checkOutTime).toBeTruthy();
    expect(checkOutResponse.body.hoursWorked).toBeGreaterThanOrEqual(0);
  });
});
