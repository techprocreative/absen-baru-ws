# Implementation Checklist - FaceSenseAttend Production Readiness

**Versi**: 1.1
**Tanggal**: 15 Januari 2025
**Status**: Employee-Only System - Guest Functionality Removed

**IMPORTANT**: This system has been converted to an employee-only attendance system. All guest-related functionality has been removed.

---

## 📋 Quick Reference

| Phase | Items | Estimated Time | Priority |
|-------|-------|----------------|----------|
| **Critical** | 16 items | 2-3 weeks | 🔴 MUST DO |
| **High Priority** | 19 items | 2-3 weeks | 🟠 SHOULD DO |
| **Medium Priority** | 13 items | 1-2 weeks | 🟡 NICE TO HAVE |
| **TOTAL** | **48 items** | **5-8 weeks** | |

---

## 🚨 PHASE 1: CRITICAL ISSUES (2-3 Weeks)

### Week 1-2: Security & Infrastructure

#### ✅ C1. Environment Variables & Secret Management
**Priority**: 🔴 CRITICAL | **Estimasi**: 1 hari | **Owner**: Backend

**Tasks**:
- [x] Update [`server/config.ts`](../server/config.ts:1) with Zod validation
  - [x] Add 64-char hex validation for SESSION_SECRET
  - [x] Add 64-char hex validation for JWT_SECRET
  - [x] Add SSL_CERT_PATH and SSL_KEY_PATH variables
  - [x] Add ENCRYPTION_KEY validation (32 chars)
  - [x] Add LOG_DIR and LOG_LEVEL variables

- [x] Generate strong secrets using crypto
  ```bash
  node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
  node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
  node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(16).toString('hex'))"
  ```

- [x] Update [`.env.example`](../.env.example:1) with new variables
  - [x] Add SSL configuration section
  - [x] Add logging configuration
  - [x] Add documentation comments

- [x] Test environment validation
  - [x] Verify secrets are validated on startup
  - [x] Verify error messages are clear
  - [x] Document key generation process

**Acceptance Criteria**:
- ✅ Semua secrets minimal 64 karakter dengan format hex
- ✅ Validation error jika secrets tidak memenuhi syarat
- ✅ Documentation lengkap untuk key generation
- ✅ Environment variables untuk SSL

**Files Modified**: [`server/config.ts`](../server/config.ts:1), [`.env.example`](../.env.example:1)

---

#### ✅ C2. Face Recognition Models Management
**Priority**: 🔴 CRITICAL | **Estimasi**: 1 hari | **Owner**: Backend

**Tasks**:
- [x] Improve [`scripts/download-models.js`](../scripts/download-models.js:1)
  - [x] Add idempotent download (skip if exists)
  - [x] Add proper error handling
  - [x] Add progress logging
  - [x] Add retry mechanism

- [x] Create `server/utils/validateModels.ts` (NEW)
  - [x] List all required models
  - [x] Create validation function
  - [x] Return missing models list

- [x] Add startup validation in [`server/index.ts`](../server/index.ts:1)
  - [x] Call validateModels() before server start
  - [x] Exit with error if models missing
  - [x] Log clear instructions

- [x] Update package.json
  - [x] Add postinstall script for models

**Acceptance Criteria**:
- ✅ Models otomatis terdownload saat `npm install`
- ✅ Startup validation mencegah server jalan tanpa models
- ✅ Clear error messages dengan instruksi
- ✅ Idempotent (tidak download ulang jika sudah ada)

**Files Created**: `server/utils/validateModels.ts`  
**Files Modified**: [`scripts/download-models.js`](../scripts/download-models.js:1), [`server/index.ts`](../server/index.ts:1), `package.json`

---

#### ✅ C3. Database Connection Pooling & Health Check
**Priority**: 🔴 CRITICAL | **Estimasi**: 1 hari | **Owner**: Backend

**Tasks**:
- [x] Update [`server/db.ts`](../server/db.ts:1)
  - [x] Configure pool with proper limits (20 for prod, 5 for dev)
  - [x] Set idleTimeoutMillis: 30000
  - [x] Set connectionTimeoutMillis: 5000
  - [x] Add pool event handlers (connect, error, remove)

- [x] Create checkDatabaseHealth() function
  - [x] Test connection with SELECT 1
  - [x] Return boolean status
  - [x] Log errors properly

- [x] Create closeDatabaseConnection() function
  - [x] Graceful pool shutdown
  - [x] Error handling

- [x] Test pool configuration
  - [x] Verify connections are reused
  - [x] Verify no connection leaks

**Acceptance Criteria**:
- ✅ Connection pool configured dengan limits yang tepat
- ✅ Error handling untuk pool events
- ✅ Health check function available
- ✅ Graceful shutdown implemented

**Files Modified**: [`server/db.ts`](../server/db.ts:1)

---

#### ✅ C4. HTTPS/TLS Configuration
**Priority**: 🔴 CRITICAL | **Estimasi**: 1 hari | **Owner**: DevOps

**Tasks**:
- [x] Create `server/https.ts` (NEW)
  - [x] Add createServer() function
  - [x] Check for SSL certificates in production
  - [x] Configure TLS 1.2+ with strong ciphers
  - [x] Fallback to HTTP in development

- [x] Create `server/middleware/httpsRedirect.ts` (NEW)
  - [x] Redirect HTTP to HTTPS in production
  - [x] Check X-Forwarded-Proto header

- [x] Update [`server/index.ts`](../server/index.ts:1)
  - [x] Use createServer() instead of app.listen()
  - [x] Add httpsRedirect middleware
  - [x] Log protocol being used

- [x] Obtain SSL certificates
  - [x] Use Let's Encrypt or purchase certificate
  - [x] Configure in environment variables

**Acceptance Criteria**:
- ✅ HTTPS configured untuk production
- ✅ Automatic redirect dari HTTP ke HTTPS
- ✅ Strong TLS configuration (TLS 1.2+)
- ✅ Clear error messages jika certificates missing

**Files Created**: `server/https.ts`, `server/middleware/httpsRedirect.ts`  
**Files Modified**: [`server/index.ts`](../server/index.ts:1)

---

#### ✅ C5. Comprehensive Rate Limiting
**Priority**: 🔴 CRITICAL | **Estimasi**: 1 hari | **Owner**: Backend

**Tasks**:
- [x] Create `server/middleware/rateLimiting.ts` (NEW)
  - [x] globalLimiter: 100 req/15min
  - [x] authLimiter: 5 req/15min (skip successful)
  - [x] faceRecognitionLimiter: 10 req/min
  - [x] enrollmentLimiter: 3 req/hour
  - [x] apiLimiter: 30 req/min

- [x] Update [`server/index.ts`](../server/index.ts:1)
  - [x] Apply globalLimiter to all routes
  - [x] Apply authLimiter to /api/login and /api/register
  - [x] Apply apiLimiter to /api routes

- [x] Add logging for rate limit violations
  - [x] Log IP address
  - [x] Log endpoint attempted

**Acceptance Criteria**:
- ✅ Global rate limiting
- ✅ Endpoint-specific limits
- ✅ Proper logging
- ✅ User-friendly error messages

**Files Created**: `server/middleware/rateLimiting.ts`  
**Files Modified**: [`server/index.ts`](../server/index.ts:1)

---

### Week 3-4: Error Handling & Logging

#### ✅ C6. Centralized Error Handling
**Priority**: 🔴 CRITICAL | **Estimasi**: 2 hari | **Owner**: Backend

**Tasks**:
- [x] Update [`server/middleware/errorHandler.ts`](../server/middleware/errorHandler.ts:1)
  - [x] Create AppError class
  - [x] Create errorHandler middleware
  - [x] Create asyncHandler wrapper
  - [x] Handle ZodError
  - [x] Handle database errors
  - [x] Hide stack traces in production

- [x] Update all routes to use asyncHandler
  - [x] [`server/routes/guests.ts`](../server/routes/guests.ts:1)
  - [x] Other route files
  - [x] Throw AppError instead of manual res.status()

**Acceptance Criteria**:
- ✅ Central error handling middleware
- ✅ Consistent error response format
- ✅ No stack traces in production
- ✅ All routes use asyncHandler

**Files Modified**: [`server/middleware/errorHandler.ts`](../server/middleware/errorHandler.ts:1), all route files

---

#### ✅ C7. Input Validation & Sanitization (100% COMPLETE)
**Priority**: 🔴 CRITICAL | **Estimasi**: 2 hari | **Owner**: Backend | **Status**: ✅ 100%

- [x] Install dependencies
  ```bash
  npm install dompurify isomorphic-dompurify
  ```

- [x] Create `server/middleware/validation.ts` (NEW)
  - [x] Create sanitizeString() function
  - [x] Create sanitizeObject() function
  - [x] Create validateBody() middleware
  - [x] Create validateBase64Image() function
  - [x] Create validateImagesArray() middleware

- [x] Update schemas in `shared/schema.ts`
  - [x] Add stronger regex validation
  - [x] Add length limits
  - [x] Add format validation

- [x] Apply validation to all routes
  - [x] Use validateBody() middleware consistently across ALL routes
  - [x] Refactored [`server/routes.ts`](../server/routes.ts:1) to use validateBody() and asyncHandler()
  - [x] All routes now follow consistent validation pattern

**Acceptance Criteria**:
- ✅ All endpoints validate input
- ✅ XSS protection via sanitization
- ✅ Image validation (size, type, count)
- ✅ Strong regex validation
- ✅ Consistent middleware usage across all routes

**Files Created**: `server/middleware/validation.ts`
**Files Modified**: `shared/schema.ts`, [`server/routes.ts`](../server/routes.ts:1), all route files

---

#### ✅ C8. Production-Grade Logging
**Priority**: 🔴 CRITICAL | **Estimasi**: 1 hari | **Owner**: Backend

- [x] Install winston-daily-rotate-file
  ```bash
  npm install winston-daily-rotate-file
  ```

- [x] Update [`server/logger.ts`](../server/logger.ts:1)
  - [x] Add daily rotation for app logs (14 days retention)
  - [x] Add daily rotation for error logs (30 days retention)
  - [x] Add daily rotation for audit logs (90 days retention)
  - [x] Create auditLogger
  - [x] Create logAudit() helper

- [x] Add audit logging to sensitive operations
  - [x] Login events
  - [x] Guest enrollment
  - [x] Attendance check-in/out
  - [x] Face verification attempts

**Acceptance Criteria**:
- ✅ Log rotation configured (daily)
- ✅ Different retention for different log types
- ✅ Audit trail for sensitive operations
- ✅ Structured logging (JSON format)

**Files Modified**: [`server/logger.ts`](../server/logger.ts:1), route files with sensitive operations

---

#### ✅ C9. Health Check & Monitoring
**Priority**: 🔴 CRITICAL | **Estimasi**: 1 hari | **Owner**: Backend

**Tasks**:
- [x] Create `server/routes/health.ts` (NEW)
  - [x] GET /api/ping - Simple ping
  - [x] GET /api/health - Detailed health check
  - [x] GET /api/ready - Readiness probe (K8s)
  - [x] GET /api/live - Liveness probe (K8s)

- [x] Health check should verify:
  - [x] Database connectivity
  - [x] Face models loaded
  - [x] Memory usage
  - [x] Uptime

- [x] Register health routes in [`server/index.ts`](../server/index.ts:1)

**Acceptance Criteria**:
- ✅ /ping endpoint untuk load balancer
- ✅ /health endpoint dengan detailed status
- ✅ /ready dan /live untuk Kubernetes
- ✅ Response time monitoring

**Files Created**: `server/routes/health.ts`  
**Files Modified**: [`server/index.ts`](../server/index.ts:1)

---

#### ✅ C10. Deployment Configuration
**Priority**: 🔴 CRITICAL | **Estimasi**: 2 hari | **Owner**: DevOps

- [x] Create `scripts/deploy.sh` (NEW)
  - [x] Backup database before deployment
  - [x] Pull latest code
  - [x] Install dependencies
  - [x] Run migrations
  - [x] Download models
  - [x] Build application
  - [x] Run tests
  - [x] Restart service with health check
  - [x] Rollback on failure

- [x] Create/Update `ecosystem.config.js`
  - [x] Configure PM2 cluster mode
  - [x] Set memory limits
  - [x] Configure log files
  - [x] Set environment variables

- [x] Make deploy script executable
  ```bash
  chmod +x scripts/deploy.sh
  ```

**Acceptance Criteria**:
- ✅ Automated deployment script
- ✅ Database backup before deployment
- ✅ Automatic rollback on failure
- ✅ Health check validation

**Files Created**: `scripts/deploy.sh`  
**Files Modified**: `ecosystem.config.js`

---

## 🔥 PHASE 2: HIGH PRIORITY (2-3 Weeks)

### Week 5-6: Enhanced Features & Security

#### ✅ H1. Enhanced Error Messages
**Priority**: 🟠 HIGH | **Estimasi**: 2 hari | **Owner**: Backend

**Tasks**:
- [x] Review all error messages in application
- [x] Create user-friendly error messages
- [x] Add error codes to documentation
- [x] Ensure no sensitive data in error messages

**Files Modified**: All route files, [`server/middleware/errorHandler.ts`](../server/middleware/errorHandler.ts:1)

---

#### ✅ H2. Complete Input Validation (100% COMPLETE)
**Priority**: 🟠 HIGH | **Estimasi**: 2 hari | **Owner**: Backend | **Status**: ✅ 100%

**Tasks**:
- [x] Audit all endpoints for input validation
- [x] Add missing validations
- [x] Refactored all routes in [`server/routes.ts`](../server/routes.ts:1) to use consistent validation
- [x] Applied validateBody() middleware to all routes requiring validation
- [x] Applied asyncHandler() wrapper to all async route handlers
- [x] Consistent error handling with AppError throughout
- [x] Test edge cases
- [x] Add validation tests

**Acceptance Criteria**:
- ✅ All endpoints use validateBody() middleware where applicable
- ✅ All async handlers wrapped with asyncHandler()
- ✅ Consistent error handling with AppError
- ✅ No inline try-catch blocks in routes

**Files Modified**: [`server/routes.ts`](../server/routes.ts:1), all route files, `shared/schema.ts`

---

#### ✅ H3. Audit Logging Enhancement
**Priority**: 🟠 HIGH | **Estimasi**: 1 hari | **Owner**: Backend

**Tasks**:
- [x] Review audit logging coverage
- [x] Add missing audit logs
- [x] Ensure IP and user agent logged
- [x] Test audit log retention

**Files Modified**: All route files with sensitive operations

---

#### ✅ H4. Monitoring Enhancement
**Priority**: 🟠 HIGH | **Estimasi**: 1 hari | **Owner**: Backend

**Tasks**:
- [x] Add response time metrics
- [x] Add error rate metrics
- [x] Add active connections metrics
- [x] Create monitoring dashboard

**Files Modified**: [`server/routes/health.ts`](../server/routes/health.ts:1)

---

#### ✅ H5. Enhanced Session Security (100% COMPLETE)
**Priority**: 🟠 HIGH | **Estimasi**: 1 hari | **Owner**: Backend | **Status**: ✅ 100%

**Tasks**:
- [x] Update [`server/session.ts`](../server/session.ts:1)
  - [x] Configure secure cookie settings
  - [x] Add session regeneration helper (`regenerateSession()`)
  - [x] Set proper SameSite attribute
  - [x] Configure session pruning

- [x] Update login route to regenerate session
  - [x] Added `await regenerateSession(req)` after successful authentication
  - [x] Session now regenerated before setting userId to prevent fixation attacks
- [x] Test session security

**Acceptance Criteria**:
- ✅ Secure cookie settings
- ✅ Session fixation protection implemented
- ✅ CSRF protection via SameSite
- ✅ Session pruning configured
- ✅ Session regeneration on login

**Files Modified**: [`server/session.ts`](../server/session.ts:1), [`server/routes.ts`](../server/routes.ts:1) (login route)

---

## ⚠️ PHASE 3: MEDIUM PRIORITY (1-2 Weeks)

### Week 7-8: Testing, Documentation & Polish

#### ✅ M1. Testing Coverage Enhancement
**Priority**: 🟡 MEDIUM | **Estimasi**: 3 hari | **Owner**: QA/Backend

- [x] Run coverage report
  ```bash
  npm run test:coverage
  ```

- [x] Create `server/__tests__/integration/employee-flow.test.ts`
  - [x] Test login
  - [x] Test check-in
  - [x] Test check-out
  - [x] Test duplicate check-in prevention

- [x] Create `server/utils/__tests__/validation.test.ts`
  - [x] Test image validation
  - [x] Test input sanitization
  - [x] Test edge cases

- [x] Add missing unit tests
- [x] Achieve 75%+ coverage

**Target Coverage**:
- Lines: 75%
- Functions: 75%
- Branches: 70%
- Statements: 75%

**Files Created**: Multiple test files

---

#### ✅ M2. Frontend Error Handling & UX
**Priority**: 🟡 MEDIUM | **Estimasi**: 2 hari | **Owner**: Frontend

**Tasks**:
- [x] Verify `client/src/components/ErrorBoundary.tsx` exists
- [x] Verify `client/src/hooks/use-error-handler.ts` exists
- [x] Verify `client/src/components/LoadingSpinner.tsx` exists
- [x] Verify `client/src/lib/api.ts` has proper error handling
- [x] Add loading states to all async operations
- [x] Test error scenarios

**Acceptance Criteria**:
- ✅ Error boundary implemented
- ✅ Consistent error messages
- ✅ Loading states untuk semua async operations
- ✅ Network error handling

**Files Modified**: Frontend components

---

#### ✅ M3. Database Indexing & Performance
**Priority**: 🟡 MEDIUM | **Estimasi**: 1 hari | **Owner**: Backend

**Tasks**:
- [x] Verify `migrations/0002_add_indexes.sql` exists
- [x] Verify `migrations/0002_add_indexes_rollback.sql` exists
- [x] Run migration in development
- [x] Test query performance
- [x] Verify all indexes created

**Acceptance Criteria**:
- ✅ All foreign keys indexed
- ✅ Commonly queried columns indexed
- ✅ Composite indexes untuk complex queries
- ✅ Query performance improved (< 50ms)

**Files Verified**: [`migrations/0002_add_indexes.sql`](../migrations/0002_add_indexes.sql:1), [`migrations/0002_add_indexes_rollback.sql`](../migrations/0002_add_indexes_rollback.sql:1)

---

#### ✅ M4. API Documentation Enhancement
**Priority**: 🟡 MEDIUM | **Estimasi**: 2 hari | **Owner**: Tech Writer

**Tasks**:
- [x] Update [`docs/API.md`](../docs/API.md:1)
  - [x] Add employee endpoints documentation
  - [x] Add complete request/response examples
  - [x] Add error codes reference
  - [x] Add authentication requirements

**Acceptance Criteria**:
- ✅ All endpoints documented
- ✅ Complete request/response examples
- ✅ Error codes documented
- ✅ Authentication requirements clear

**Files Modified**: [`docs/API.md`](../docs/API.md:1)

---

#### ✅ M5. Deployment Automation Enhancement
**Priority**: 🟡 MEDIUM | **Estimasi**: 2 hari | **Owner**: DevOps

**Tasks**:
- [x] Test deployment script in staging
- [x] Add CI/CD pipeline configuration
- [x] Create rollback procedures
- [x] Document deployment process

**Files Modified**: `scripts/deploy.sh`, CI/CD config files

---

#### ✅ M6. Security Headers & CORS
**Priority**: 🟡 MEDIUM | **Estimasi**: 1 hari | **Owner**: Backend

**Tasks**:
- [x] Verify `server/middleware/security.ts` exists and is complete
  - [x] Helmet with CSP configured
  - [x] HSTS enabled
  - [x] Strict CORS policy
  - [x] X-Frame-Options set

- [x] Test security headers
- [x] Run security audit

**Acceptance Criteria**:
- ✅ Comprehensive security headers
- ✅ Strict CORS policy
- ✅ CSP headers configured
- ✅ HSTS enabled

**Files Verified**: [`server/middleware/security.ts`](../server/middleware/security.ts:1)

---

## 🧪 Testing Checklist

### Pre-Implementation Testing
- [ ] Run baseline performance tests
  ```bash
  npm run test:performance
  ```
- [ ] Run security audit
  ```bash
  npm audit
  ```
- [ ] Record current metrics

### During Implementation
- [ ] Run unit tests after each change
  ```bash
  npm test
  ```
- [ ] Run integration tests after milestones
  ```bash
  npm run test:integration
  ```

### Manual Testing Checklist

**Guest Flow**:
- [ ] Enrollment dengan 5 gambar
- [ ] Enrollment dengan 10 gambar
- [ ] Duplicate email rejection
- [ ] Face verification check-in
- [ ] Check-out calculation
- [ ] History retrieval
- [ ] Token expiration

**Employee Flow**:
- [ ] Login dengan credentials
- [ ] Face-based check-in
- [ ] Check-out
- [ ] Attendance history
- [ ] Dashboard access

**Security**:
- [ ] Rate limiting enforcement
- [ ] HTTPS redirect
- [ ] Session management
- [ ] Input validation
- [ ] Error handling

### Post-Implementation Testing
- [ ] Load testing (100 concurrent users)
  ```bash
  npm run test:load
  ```
- [ ] Security testing (penetration test)
- [ ] Production smoke tests
  ```bash
  curl https://yourdomain.com/api/ping
  curl https://yourdomain.com/api/health
  curl https://yourdomain.com/api/ready
  ```

---

## 📋 Deployment Checklist

### Pre-Deployment (T-1 Week)

**Infrastructure**:
- [ ] Production server provisioned
- [ ] PostgreSQL database setup (15+)
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Firewall rules configured
- [ ] Backup storage setup

**Code Preparation**:
- [ ] All CRITICAL issues resolved
- [ ] All tests passing
- [ ] Coverage > 70%
- [ ] Code reviewed
- [ ] Documentation updated

**Environment Setup**:
- [ ] `.env` configured dengan production values
- [ ] Secrets generated (64-char hex)
- [ ] Database migrations tested
- [ ] Face models downloaded
- [ ] Log directories created

### Deployment Day (T-0)

**Backup**:
- [ ] Database backup created
- [ ] Code backup created
- [ ] Configuration backup created

**Deploy**:
- [ ] Stop current service (if any)
- [ ] Pull latest code
- [ ] Install dependencies (`npm ci --production`)
- [ ] Run migrations (`npm run migrate`)
- [ ] Build application (`npm run build`)
- [ ] Start service (PM2 or systemd)
- [ ] Verify health check

**Validation**:
- [ ] Health endpoint responding
- [ ] HTTPS working
- [ ] Database connected
- [ ] Face models loaded
- [ ] Logs writing correctly

**Smoke Tests**:
- [ ] Login test
- [ ] Guest enrollment test
- [ ] Check-in test
- [ ] API rate limiting test

### Post-Deployment (T+1 Day)

**Monitoring**:
- [ ] Check error logs
- [ ] Monitor response times
- [ ] Check database connections
- [ ] Verify disk space
- [ ] Check memory usage

**User Acceptance**:
- [ ] Test dengan real users
- [ ] Gather feedback
- [ ] Monitor support tickets
- [ ] Check analytics

---

## ✅ Success Criteria

### Technical Metrics
- [ ] **Uptime**: > 99.9%
- [ ] **Response Time**: < 200ms (p95)
- [ ] **Error Rate**: < 0.1%
- [ ] **Test Coverage**: > 70%
- [ ] **Security Score**: A grade (observatory.mozilla.org)
- [ ] **Performance Score**: > 90 (Lighthouse)

### Business Metrics
- [ ] **User Satisfaction**: > 4.5/5
- [ ] **Support Tickets**: < 5/week
- [ ] **Successful Enrollments**: > 95%
- [ ] **Check-in Success Rate**: > 98%
- [ ] **System Availability**: 24/7

### Compliance
- [ ] **HTTPS**: Enforced
- [ ] **Data Privacy**: GDPR compliant
- [ ] **Audit Trail**: Complete
- [ ] **Backup**: Daily automated
- [ ] **Security**: Passed penetration test

---

## 📊 Progress Tracking

### Phase Completion

| Phase | Progress | Status |
|-------|----------|--------|
| Critical Issues (C1-C10) | 10/10 | ✅ Completed |
| High Priority (H1-H5) | 5/5 | ✅ Completed |
| Medium Priority (M1-M6) | 6/6 | ✅ Completed |

### Weekly Progress Report

**Week**: _____________

**Completed**:
- 

**In Progress**:
- 

**Blocked**:
- 

**Next Week**:
- 

---

## 🚨 Incident Response

### Rollback Procedure
```bash
# Stop current service
pm2 stop facesenseattend

# Restore database from backup
psql $DATABASE_URL < backups/latest/database.sql

# Checkout previous version
git checkout previous-stable-tag

# Rebuild and restart
npm ci --production
npm run build
pm2 start ecosystem.config.js

# Verify
curl https://yourdomain.com/api/health
```

---

## 📞 Support Contacts

**Development Team**: [backend@company.com]  
**DevOps Team**: [devops@company.com]  
**Tech Lead**: [techlead@company.com]  
**Project Manager**: [pm@company.com]

---

## 📝 Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | | | |
| Security Lead | | | |
| DevOps Lead | | | |
| Project Manager | | | |

---

**Last Updated**: 15 Januari 2025
**Document Version**: 1.1

**Notes**:
- Update checklist setiap hari
- Mark completed items with current date
- Document any deviations from plan
- Keep backup of all changes
- **SYSTEM CHANGE**: This is now an **employee-only** attendance system. All guest functionality has been removed:
  - Removed `server/routes/guests.ts`
  - Removed `server/routes/__tests__/guests.test.ts`
  - Removed `server/__tests__/integration/guest-flow.test.ts`
  - Removed `client/src/pages/guest-landing.tsx`
  - Removed `client/src/components/guest-enrollment-wizard.tsx`
  - Removed `client/src/components/guest-check-in.tsx`
  - Updated [`docs/API.md`](../docs/API.md:1) to remove guest endpoints
  - Employee kiosk set as landing page in [`client/src/App.tsx`](../client/src/App.tsx:1)

*This checklist should be used in conjunction with [`docs/PRODUCTION_REMEDIATION.md`](../docs/PRODUCTION_REMEDIATION.md) for detailed implementation instructions.*