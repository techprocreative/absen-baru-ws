import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json, date, pgEnum, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["employee", "admin", "hr"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late"]);

// Departments table
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table (combined with employees)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  employeeId: text("employee_id").notNull().unique(),
  role: userRoleEnum("role").notNull().default("employee"),
  status: userStatusEnum("status").notNull().default("active"),
  departmentId: varchar("department_id").references(() => departments.id),
  photoUrl: text("photo_url"),
  faceDescriptors: json("face_descriptors").$type<number[][]>(),
  joinDate: date("join_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Guests table for anonymous attendance
export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Personal info
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  purpose: text("purpose").notNull(),
  
  // Face recognition data
  faceDescriptors: json("face_descriptors").$type<number[][]>().notNull(),
  descriptorCount: integer("descriptor_count").notNull().default(5),
  
  // Session management
  checkInToken: text("check_in_token").unique(),
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Privacy & compliance
  consentGiven: boolean("consent_given").notNull().default(true),
  consentTimestamp: timestamp("consent_timestamp").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Data retention
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull().$defaultFn(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 7 days from now
    return date;
  }),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Attendance table (modified to support guests)
export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // MODIFIED: Make userId nullable to support guests
  userId: varchar("user_id").references(() => users.id),
  
  // NEW: Add guestId for guest attendance
  guestId: varchar("guest_id").references(() => guests.id, { onDelete: 'cascade' }),
  
  date: date("date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  status: attendanceStatusEnum("status").notNull().default("present"),
  hoursWorked: real("hours_worked").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  faceDescriptors: z.array(z.array(z.number())).nullable().optional(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

// Guest schemas
export const insertGuestSchema = createInsertSchema(guests, {
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  purpose: z.string().min(5).max(200),
  faceDescriptors: z.array(z.array(z.number()).length(128)).min(5).max(10),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectGuestSchema = createSelectSchema(guests);

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type LoginData = z.infer<typeof loginSchema>;
