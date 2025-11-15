# FaceSenseAttend API Documentation

## Employee Authentication API

### POST /api/auth/login

Authenticate employees/HR/admins and issue a short-lived session token.

**Request:**
```json
{
  "email": "employee@example.com",
  "password": "emp123"
}
```

**Response (200):**
```json
{
  "token": "session-token",
  "user": {
    "id": "uuid",
    "email": "employee@example.com",
    "name": "John Doe",
    "role": "employee",
    "employeeId": "EMP003",
    "photoUrl": null
  }
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_REQUEST | Request body failed validation |
| 401 | INVALID_CREDENTIALS | Email/password mismatch |

### POST /api/auth/logout

Invalidate the current session token.

**Headers:** `Authorization: Bearer <session-token>`

**Response (200):**
```json
{ "message": "Logged out" }
```

### GET /api/auth/me

Return the authenticated user profile.

**Headers:** `Authorization: Bearer <session-token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "employee@example.com",
  "name": "John Doe",
  "role": "employee",
  "employeeId": "EMP003",
  "photoUrl": null
}
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid session token |
| 401 | SESSION_EXPIRED | Token expired (re-login required) |
| 404 | NOT_FOUND | User no longer exists |

## Employee Attendance API

All endpoints below require `Authorization: Bearer <session-token>` header.

### POST /api/attendance/check-in

Record the employee's check-in time. Returns HTTP 201 with the new attendance row.

**Response (201):**
```json
{
  "id": "attendance-id",
  "userId": "uuid",
  "date": "2024-01-15",
  "checkInTime": "2024-01-15T08:45:12.123Z",
  "status": "present",
  "hoursWorked": 0
}
```

**Error Responses:**

| Status | Error Code/Message | Description |
|--------|--------------------|-------------|
| 400 | "Already checked in today" | Duplicate check-in blocked |
| 401 | UNAUTHORIZED/SESSION_EXPIRED | Missing or invalid session |

### POST /api/attendance/check-out

Complete the attendance record and calculate `hoursWorked`.

**Response (200):**
```json
{
  "id": "attendance-id",
  "userId": "uuid",
  "date": "2024-01-15",
  "checkInTime": "2024-01-15T08:45:12.123Z",
  "checkOutTime": "2024-01-15T17:03:44.912Z",
  "hoursWorked": 8.3,
  "status": "present"
}
```

**Error Responses:**

| Status | Message | Description |
|--------|---------|-------------|
| 400 | "No check-in found for today" | Check-out attempted before check-in |
| 400 | "Already checked out today" | Prevent duplicate check-out |
| 401 | UNAUTHORIZED/SESSION_EXPIRED | Missing or expired token |

### GET /api/attendance/my-records

Returns the authenticated employee's attendance history (most recent first).

### GET /api/attendance/today

Returns today's attendance record for the authenticated employee or `null` if none.

### GET /api/attendance/today-all

Returns every attendance record for the current day. Reserved for dashboard views (still protected by `requireAuth`).

## Analytics & Reporting API

All analytics endpoints require authentication.

| Endpoint | Description |
|----------|-------------|
| `GET /api/analytics/overview` | Aggregated metrics (employee counts, avg attendance rate, etc.) |
| `GET /api/analytics/weekly` | Static weekly breakdown used for dashboards |
| `GET /api/analytics/departments` | Attendance counts grouped by department |

## User Management API

These endpoints currently require authentication (role-based restrictions can be added later).

### GET /api/users
List all users with summary fields (email, role, status, department, join date).

### POST /api/users
Create a user. Passwords are hashed server-side.

**Request:**
```json
{
  "email": "new.user@example.com",
  "password": "Secret123",
  "name": "New User",
  "employeeId": "EMP999",
  "role": "employee",
  "status": "active",
  "departmentId": "uuid",
  "joinDate": "2024-02-01"
}
```

### PATCH /api/users/:id
Update a subset of user fields (email, name, department, status, password, etc.). Payload must pass strict validation; passwords are re-hashed automatically.

### DELETE /api/users/:id
Delete a user and return `{ "message": "User deleted" }` when successful.

Common error cases for the user management endpoints:

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Validation errors array | Provided data invalid |
| 401 | UNAUTHORIZED/SESSION_EXPIRED | Missing/expired session token |
| 404 | "User not found" | Target user does not exist |

## Department API

### GET /api/departments
Return the list of all departments for use in dropdowns/forms. Requires authentication.

---

## Error Codes Reference

All error responses follow this format:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Employee Session Errors
- **UNAUTHORIZED**: Missing `Authorization` header or token not recognized
- **SESSION_EXPIRED**: Session token expired (login again)
- **INVALID_CREDENTIALS**: Email/password combination invalid
- **INVALID_REQUEST**: Request payload failed validation
- **NOT_FOUND**: Authenticated user record removed
- **USER_NOT_FOUND**: User not found in database

### Attendance Errors
- **ALREADY_CHECKED_IN**: Cannot check in twice on the same day
- **NO_CHECK_IN**: Cannot check out without checking in first
- **ALREADY_CHECKED_OUT**: Cannot check out twice on the same day

### Rate Limit Errors
HTTP 429 with message indicating rate limit exceeded.

---

## Status Values

| Status | Description |
|--------|-------------|
| present | Checked in before 9:00 AM |
| late | Checked in after 9:00 AM |
| absent | No check-in record for the day |

---

## Security Considerations

1. **Rate Limiting**: Strict limits prevent abuse
2. **Session Tokens**: Secure session management with regeneration on login
3. **HTTPS Required**: All production traffic must use HTTPS
4. **Password Security**: Passwords are hashed using bcrypt
5. **Session Security**: Sessions regenerated on authentication to prevent fixation attacks