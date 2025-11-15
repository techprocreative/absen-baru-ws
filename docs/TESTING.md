# Testing Documentation

## Overview

FaceSenseAttend includes comprehensive testing suite covering unit tests, integration tests, performance tests, and end-to-end tests.

## Test Structure

```
server/__tests__/
├── setup.ts                    # Global test setup
├── integration/
│   └── guest-flow.test.ts     # Integration tests for guest workflow
└── performance/
    └── load-test.ts           # Performance and load tests

scripts/
└── e2e-test.ts                # End-to-end test script
```

## Running Tests

### All Tests
```bash
npm test              # Run all unit and integration tests
npm run test:all      # Run all tests including E2E
```

### Specific Test Suites
```bash
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
npm run test:integration   # Run integration tests only
npm run test:performance   # Run performance tests only
npm run test:e2e          # Run end-to-end tests
```

## Test Coverage

### Current Coverage Targets
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Coverage Reports
After running `npm run test:coverage`, reports are available in:
- `coverage/index.html` - HTML coverage report
- `coverage/coverage-final.json` - JSON coverage data
- `coverage/lcov.info` - LCOV format for CI/CD

## Integration Tests

### Guest Attendance Flow Tests

**File**: [`server/__tests__/integration/guest-flow.test.ts`](../server/__tests__/integration/guest-flow.test.ts)

Covers the complete guest attendance workflow:

1. **Enrollment Tests**
   - ✅ Successful enrollment with valid data
   - ✅ Duplicate email rejection
   - ✅ Consent requirement validation
   - ✅ Minimum face images validation

2. **Status Check Tests**
   - ✅ Status retrieval with valid token
   - ✅ Rejection without token
   - ✅ Rejection with invalid token

3. **Check-In Tests**
   - ✅ Successful check-in with valid face
   - ✅ Rejection without authentication
   - ✅ Duplicate check-in prevention

4. **Check-Out Tests**
   - ✅ Successful check-out after check-in
   - ✅ Rejection without prior check-in
   - ✅ Hours worked calculation

5. **History Tests**
   - ✅ Attendance history retrieval

6. **Rate Limiting Tests**
   - ✅ Enrollment rate limit enforcement

## Performance Tests

**File**: [`server/__tests__/performance/load-test.ts`](../server/__tests__/performance/load-test.ts)

### Performance Benchmarks

| Test | Target | Description |
|------|--------|-------------|
| Status Check Response | < 100ms | Single status check |
| Concurrent Requests | < 200ms avg | 50 concurrent requests |
| Database Query | < 500ms | Guest status with DB query |
| Memory Usage | < 50MB increase | 10 enrollments |
| Rate Limiting | < 300ms avg | Requests up to limit |
| Large Payload | < 2000ms | Handle large face images |
| Mixed Operations | < 3000ms | Multiple concurrent operations |

## End-to-End Tests

**File**: [`scripts/e2e-test.ts`](../scripts/e2e-test.ts)

### E2E Test Workflow

1. Server health check
2. Guest enrollment
3. Status verification
4. Check-in process
5. Check-out process
6. History retrieval
7. Error handling validation

### Running E2E Tests

```bash
# Start the server first
npm run dev

# In another terminal, run E2E tests
npm run test:e2e
```

## CI/CD Integration

### GitHub Actions Workflow

**File**: [`.github/workflows/test.yml`](../.github/workflows/test.yml)

The CI/CD pipeline runs on:
- Push to `main` or `develop` branches
- Pull requests to `main`

### Pipeline Steps

1. **Test Job**
   - Lint checking
   - Unit tests
   - Integration tests
   - Coverage report generation
   - Build verification

2. **Performance Job**
   - Performance benchmarks
   - Load testing

3. **Security Job**
   - NPM audit
   - Vulnerability scanning

## Test Environment Setup

### Required Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/facesense_test
SESSION_SECRET=test-session-secret
JWT_SECRET=test-jwt-secret
NODE_ENV=test
```

### Test Database Setup

1. Create test database:
```bash
createdb facesense_test
```

2. Run migrations:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/facesense_test npm run db:push
```

## Writing Tests

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../index';

describe('Feature Tests', () => {
  it('should test feature', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'test' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Performance Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('Performance Tests', () => {
  it('should complete within time limit', async () => {
    const start = Date.now();
    
    await performOperation();
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

## Mocking

### Face Recognition Mocking

Face-api.js is automatically mocked in test setup for consistent testing. Override in specific tests if needed:

```typescript
import { vi } from 'vitest';

vi.mock('face-api.js', () => ({
  // Your custom mock
}));
```

## Debugging Tests

### Enable Debug Output

```bash
DEBUG=* npm test
```

### Run Single Test File

```bash
npx vitest run server/__tests__/integration/guest-flow.test.ts
```

### Run Single Test

```bash
npx vitest run -t "should successfully enroll"
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after tests
3. **Mocking**: Mock external dependencies
4. **Assertions**: Use clear, specific assertions
5. **Performance**: Keep tests fast (< 5s per test)
6. **Coverage**: Aim for high code coverage
7. **Documentation**: Document complex test scenarios

## Troubleshooting

### Tests Failing in CI but Passing Locally

- Check environment variables
- Verify database connection
- Check Node.js version compatibility
- Review CI logs for specific errors

### Timeout Errors

- Increase timeout in vitest.config.ts
- Check for hung promises
- Verify database connections are closed

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify DATABASE_URL is correct
- Check database permissions
- Clean up test data between runs

## Performance Optimization

### Test Optimization Tips

1. Use `beforeAll` for expensive setup
2. Reuse database connections
3. Mock external API calls
4. Use parallel test execution
5. Clean up only when necessary

## Coverage Goals by Module

| Module | Current | Target |
|--------|---------|--------|
| API Routes | TBD | 80% |
| Middleware | TBD | 90% |
| Database | TBD | 70% |
| Face Recognition | TBD | 60% |
| Authentication | TBD | 85% |

## Continuous Improvement

- Regular review of test coverage
- Add tests for new features
- Update tests when APIs change
- Monitor test execution time
- Keep dependencies updated

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)