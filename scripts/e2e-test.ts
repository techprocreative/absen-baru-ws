#!/usr/bin/env tsx

/**
 * End-to-End Test Script
 * Tests complete guest attendance workflow
 */

import chalk from 'chalk';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(chalk.green(`✓ ${name}`));
  } catch (error) {
    results.push({ 
      name, 
      passed: false, 
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start 
    });
    console.log(chalk.red(`✗ ${name}`));
    console.log(chalk.gray(`  Error: ${error}`));
  }
}

async function testEnrollment() {
  const response = await fetch('http://localhost:5000/api/guests/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Test User',
      email: `e2e-${Date.now()}@test.com`,
      purpose: 'End-to-end testing',
      consent: true,
      faceImages: Array(5).fill('data:image/png;base64,test'),
    }),
  });

  if (!response.ok) {
    throw new Error(`Enrollment failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.guest.token) {
    throw new Error('Enrollment response invalid');
  }

  return data.guest.token;
}

async function testCheckIn(token: string) {
  const response = await fetch('http://localhost:5000/api/guests/check-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      faceImage: 'data:image/png;base64,test',
    }),
  });

  if (!response.ok) {
    throw new Error(`Check-in failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error('Check-in response invalid');
  }
}

async function testCheckOut(token: string) {
  const response = await fetch('http://localhost:5000/api/guests/check-out', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Check-out failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || typeof data.attendance.hoursWorked !== 'number') {
    throw new Error('Check-out response invalid');
  }
}

async function testStatus(token: string) {
  const response = await fetch('http://localhost:5000/api/guests/status', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.guest) {
    throw new Error('Status response invalid');
  }
}

async function testHealth() {
  const response = await fetch('http://localhost:5000/api/health');

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== 'ok') {
    throw new Error('Health check response invalid');
  }
}

async function main() {
  console.log(chalk.bold('\n🧪 Running E2E Tests\n'));
  console.log(chalk.gray('Testing against http://localhost:5000\n'));

  // Check if server is running
  await runTest('Server Health Check', testHealth);

  let token: string | null = null;

  await runTest('Guest Enrollment', async () => {
    token = await testEnrollment();
  });

  if (token) {
    await runTest('Guest Status Check', async () => {
      await testStatus(token!);
    });

    await runTest('Guest Check-In', async () => {
      await testCheckIn(token!);
    });

    // Wait a second to simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 1000));

    await runTest('Guest Check-Out', async () => {
      await testCheckOut(token!);
    });

    await runTest('Guest History', async () => {
      const response = await fetch('http://localhost:5000/api/guests/history', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('History fetch failed');
      const data = await response.json();
      if (!data.success || !Array.isArray(data.history)) {
        throw new Error('History response invalid');
      }
    });
  }

  // Test error handling
  await runTest('Invalid Token Rejection', async () => {
    const response = await fetch('http://localhost:5000/api/guests/status', {
      headers: { 'Authorization': 'Bearer invalid-token-12345' },
    });
    if (response.status !== 401) {
      throw new Error('Should reject invalid token');
    }
  });

  await runTest('Missing Consent Rejection', async () => {
    const response = await fetch('http://localhost:5000/api/guests/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Consent User',
        email: 'noconsent@test.com',
        purpose: 'Testing consent validation',
        consent: false,
        faceImages: Array(5).fill('data:image/png;base64,test'),
      }),
    });
    if (response.status !== 400) {
      throw new Error('Should reject enrollment without consent');
    }
  });

  // Print summary
  console.log(chalk.bold('\n📊 Test Summary\n'));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(chalk.green(`✓ Passed: ${passed}`));
  if (failed > 0) {
    console.log(chalk.red(`✗ Failed: ${failed}`));
  }
  
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  console.log(chalk.gray(`\nTotal Duration: ${totalDuration}ms`));
  console.log(chalk.gray(`Average per test: ${Math.round(totalDuration / results.length)}ms`));

  // Print failed tests details
  if (failed > 0) {
    console.log(chalk.bold.red('\n❌ Failed Tests:\n'));
    results.filter(r => !r.passed).forEach(r => {
      console.log(chalk.red(`  • ${r.name}`));
      console.log(chalk.gray(`    ${r.error}`));
    });
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(chalk.red('\n💥 Fatal Error:'), error);
  process.exit(1);
});