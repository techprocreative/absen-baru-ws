import type { Express } from "express";
import { storage } from "./storage.js";
import { loginSchema, insertUserSchema } from "../shared/schema.js";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authLimiter } from "./middleware/rateLimiting.js";
import { logAudit } from "./logger.js";
import { AppError, asyncHandler } from "./middleware/errorHandler.js";
import { validateBody } from "./middleware/validation.js";
import { regenerateSession } from "./session.js";


// Simple in-memory session storage
const sessions = new Map<string, { userId: string; expiresAt: number }>();

// Session middleware
function requireAuth(req: any, _res: any, next: any) {
  const sessionId = req.headers.authorization?.replace("Bearer ", "");
  
  if (!sessionId) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Unauthorized'));
  }

  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return next(new AppError(401, 'SESSION_EXPIRED', 'Session expired'));
  }

  req.userId = session.userId;
  next();
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Validation schema for user updates (partial schema without requiring all fields)
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  employeeId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  departmentId: z.string().optional(),
  photoUrl: z.string().nullable().optional(),
  faceDescriptors: z.array(z.array(z.number())).nullable().optional(),
  password: z.string().min(6).optional(),
}).strict(); // strict() prevents additional unknown fields

export async function registerRoutes(app: Express): Promise<void> {
  // Auth routes
  app.post("/api/auth/login", authLimiter, validateBody(loginSchema), asyncHandler(async (req: any, res) => {
    const { email, password } = req.body;
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    // Check password (handle both hashed and plain text for backward compatibility)
    let isValidPassword = false;
    if (user.password.startsWith('$2')) {
      // Hashed password
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // Plain text (for existing seed data)
      isValidPassword = password === user.password;
    }

    if (!isValidPassword) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    // Regenerate session for security
    await regenerateSession(req);

    const sessionId = generateSessionId();
    sessions.set(sessionId, {
      userId: user.id,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    logAudit('LOGIN', user.id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      token: sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        photoUrl: user.photoUrl,
      },
    });
  }));

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    if (sessionId) {
      sessions.delete(sessionId);
    }
    logAudit('LOGOUT', sessionId ?? 'anonymous', { ip: req.ip });
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", requireAuth, asyncHandler(async (req: any, res) => {
    const user = await storage.getUser(req.userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
      photoUrl: user.photoUrl,
    });
  }));

  // User routes
  app.get("/api/users", requireAuth, asyncHandler(async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      employeeId: u.employeeId,
      role: u.role,
      status: u.status,
      departmentId: u.departmentId,
      photoUrl: u.photoUrl,
      joinDate: u.joinDate,
    })));
  }));

  app.post("/api/users", requireAuth, validateBody(insertUserSchema), asyncHandler(async (req: any, res) => {
    const userData = req.body;
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });
    
    res.status(201).json(user);
  }));

  app.patch("/api/users/:id", requireAuth, validateBody(updateUserSchema), asyncHandler(async (req, res) => {
    const updates: any = { ...req.body };
    
    // Hash password if it's being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const user = await storage.updateUser(req.params.id, updates);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    res.json(user);
  }));

  app.delete("/api/users/:id", requireAuth, asyncHandler(async (req, res) => {
    const success = await storage.deleteUser(req.params.id);
    if (!success) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    res.json({ message: "User deleted" });
  }));

  // Attendance routes
  app.get("/api/attendance/my-records", requireAuth, asyncHandler(async (req: any, res) => {
    const records = await storage.getAttendanceByUserId(req.userId);
    res.json(records);
  }));

  app.get("/api/attendance/today", requireAuth, asyncHandler(async (req: any, res) => {
    const record = await storage.getTodayAttendance(req.userId);
    res.json(record || null);
  }));

  app.get("/api/attendance/today-all", requireAuth, asyncHandler(async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const records = await storage.getAllAttendanceByDate(today);
    res.json(records);
  }));

  app.post("/api/attendance/check-in", requireAuth, asyncHandler(async (req: any, res) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = await storage.getTodayAttendance(req.userId);
    
    if (existing) {
      throw new AppError(400, 'ALREADY_CHECKED_IN', 'Already checked in today');
    }

    const now = new Date();
    const checkInTime = now;
    
    // Determine if late (after 9:00 AM)
    const nineAM = new Date(now);
    nineAM.setHours(9, 0, 0, 0);
    const isLate = now > nineAM;

    const record = await storage.createAttendance({
      userId: req.userId,
      date: today,
      checkInTime: checkInTime,
      checkOutTime: null,
      status: isLate ? "late" : "present",
      hoursWorked: 0,
    });

    res.status(201).json(record);
  }));

  app.post("/api/attendance/check-out", requireAuth, asyncHandler(async (req: any, res) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = await storage.getTodayAttendance(req.userId);
    
    if (!existing) {
      throw new AppError(400, 'NO_CHECK_IN', 'No check-in found for today');
    }

    if (existing.checkOutTime) {
      throw new AppError(400, 'ALREADY_CHECKED_OUT', 'Already checked out today');
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(existing.checkInTime!);
    
    // Calculate hours worked with decimal precision (2 decimal places)
    const millisWorked = checkOutTime.getTime() - checkInTime.getTime();
    const hoursWorked = Math.round((millisWorked / (1000 * 60 * 60)) * 100) / 100;

    // Update record with checkout time, hours, and ensure status is "present" if it was marked present on check-in
    // (late status should remain late)
    const updated = await storage.updateAttendance(existing.id, {
      checkOutTime: checkOutTime,
      hoursWorked: hoursWorked,
      status: existing.status === "late" ? "late" : "present",
    });

    res.json(updated);
  }));

  // Analytics routes
  app.get("/api/analytics/overview", requireAuth, asyncHandler(async (req, res) => {
    const users = await storage.getAllUsers();
    const employees = users.filter(u => u.role === "employee");
    
    res.json({
      totalEmployees: employees.length,
      avgAttendanceRate: 92.5,
      avgHoursPerDay: 8.2,
      monthlyAbsences: 45,
    });
  }));

  app.get("/api/analytics/weekly", requireAuth, asyncHandler(async (req, res) => {
    // Mock weekly data
    res.json([
      { day: "Mon", present: 45, late: 5, absent: 10 },
      { day: "Tue", present: 48, late: 3, absent: 9 },
      { day: "Wed", present: 47, late: 4, absent: 9 },
      { day: "Thu", present: 46, late: 6, absent: 8 },
      { day: "Fri", present: 44, late: 7, absent: 9 },
    ]);
  }));

  app.get("/api/analytics/departments", requireAuth, asyncHandler(async (req, res) => {
    res.json([
      { name: "Engineering", value: 45, color: "hsl(var(--chart-1))" },
      { name: "Sales", value: 30, color: "hsl(var(--chart-2))" },
      { name: "Marketing", value: 25, color: "hsl(var(--chart-3))" },
      { name: "Operations", value: 20, color: "hsl(var(--chart-4))" },
      { name: "HR", value: 15, color: "hsl(var(--chart-5))" },
    ]);
  }));

  // Department routes
  app.get("/api/departments", requireAuth, asyncHandler(async (req, res) => {
    const depts = await storage.getAllDepartments();
    res.json(depts);
  }));
}
