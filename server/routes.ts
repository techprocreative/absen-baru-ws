import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Simple in-memory session storage
const sessions = new Map<string, { userId: string; expiresAt: number }>();

// Session middleware
function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace("Bearer ", "");
  
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return res.status(401).json({ error: "Session expired" });
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
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
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const sessionId = generateSessionId();
      sessions.set(sessionId, {
        userId: user.id,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
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
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        photoUrl: user.photoUrl,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", requireAuth, async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      // Validate the update payload
      const validatedUpdates = updateUserSchema.parse(req.body);
      const updates: any = { ...validatedUpdates };
      
      // Hash password if it's being updated
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Attendance routes
  app.get("/api/attendance/my-records", requireAuth, async (req: any, res) => {
    try {
      const records = await storage.getAttendanceByUserId(req.userId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/attendance/today", requireAuth, async (req: any, res) => {
    try {
      const record = await storage.getTodayAttendance(req.userId);
      res.json(record || null);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/attendance/today-all", requireAuth, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = await storage.getAllAttendanceByDate(today);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/attendance/check-in", requireAuth, async (req: any, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getTodayAttendance(req.userId);
      
      if (existing) {
        return res.status(400).json({ error: "Already checked in today" });
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
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/attendance/check-out", requireAuth, async (req: any, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getTodayAttendance(req.userId);
      
      if (!existing) {
        return res.status(400).json({ error: "No check-in found for today" });
      }

      if (existing.checkOutTime) {
        return res.status(400).json({ error: "Already checked out today" });
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
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/overview", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const employees = users.filter(u => u.role === "employee");
      
      res.json({
        totalEmployees: employees.length,
        avgAttendanceRate: 92.5,
        avgHoursPerDay: 8.2,
        monthlyAbsences: 45,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/analytics/weekly", requireAuth, async (req, res) => {
    try {
      // Mock weekly data
      res.json([
        { day: "Mon", present: 45, late: 5, absent: 10 },
        { day: "Tue", present: 48, late: 3, absent: 9 },
        { day: "Wed", present: 47, late: 4, absent: 9 },
        { day: "Thu", present: 46, late: 6, absent: 8 },
        { day: "Fri", present: 44, late: 7, absent: 9 },
      ]);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/analytics/departments", requireAuth, async (req, res) => {
    try {
      res.json([
        { name: "Engineering", value: 45, color: "hsl(var(--chart-1))" },
        { name: "Sales", value: 30, color: "hsl(var(--chart-2))" },
        { name: "Marketing", value: 25, color: "hsl(var(--chart-3))" },
        { name: "Operations", value: 20, color: "hsl(var(--chart-4))" },
        { name: "HR", value: 15, color: "hsl(var(--chart-5))" },
      ]);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Department routes
  app.get("/api/departments", requireAuth, async (req, res) => {
    try {
      const depts = await storage.getAllDepartments();
      res.json(depts);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
