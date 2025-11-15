import {
  users,
  departments,
  attendance,
  guests,
  type User,
  type InsertUser,
  type Department,
  type InsertDepartment,
  type Attendance,
  type InsertAttendance,
  type Guest,
  type InsertGuest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Department operations
  getDepartment(id: string): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Attendance operations
  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendanceByUserId(userId: string): Promise<Attendance[]>;
  getAttendanceByDate(userId: string, date: string): Promise<Attendance | undefined>;
  getTodayAttendance(userId: string): Promise<Attendance | undefined>;
  getAllAttendanceByDate(date: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<Attendance>): Promise<Attendance | undefined>;

  // Guest operations
  createGuest(data: InsertGuest): Promise<Guest>;
  getGuestById(id: string): Promise<Guest | undefined>;
  getGuestByToken(token: string): Promise<Guest | undefined>;
  getGuestByEmail(email: string): Promise<Guest | undefined>;
  updateGuest(id: string, data: Partial<InsertGuest>): Promise<Guest | undefined>;
  deleteGuest(id: string): Promise<void>;
  getGuestAttendanceToday(guestId: string): Promise<Attendance | undefined>;
  getGuestAttendanceHistory(guestId: string): Promise<Attendance[]>;
  cleanupExpiredGuests(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByEmployeeId(employeeId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.employeeId, employeeId));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Department operations
  async getDepartment(id: string): Promise<Department | undefined> {
    const [dept] = await db.select().from(departments).where(eq(departments.id, id));
    return dept || undefined;
  }

  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async createDepartment(insertDept: InsertDepartment): Promise<Department> {
    const [dept] = await db
      .insert(departments)
      .values(insertDept)
      .returning();
    return dept;
  }

  // Attendance operations
  async getAttendance(id: string): Promise<Attendance | undefined> {
    const [record] = await db.select().from(attendance).where(eq(attendance.id, id));
    return record || undefined;
  }

  async getAttendanceByUserId(userId: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }

  async getAttendanceByDate(userId: string, date: string): Promise<Attendance | undefined> {
    const [record] = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.userId, userId), eq(attendance.date, date)));
    return record || undefined;
  }

  async getTodayAttendance(userId: string): Promise<Attendance | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendanceByDate(userId, today);
  }

  async getAllAttendanceByDate(date: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.date, date));
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [record] = await db
      .insert(attendance)
      .values(insertAttendance)
      .returning();
    return record;
  }

  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance | undefined> {
    const [record] = await db
      .update(attendance)
      .set(updates)
      .where(eq(attendance.id, id))
      .returning();
    return record || undefined;
  }

  // Guest operations
  async createGuest(data: InsertGuest): Promise<Guest> {
    const [guest] = await db
      .insert(guests)
      .values(data)
      .returning();
    return guest;
  }

  async getGuestById(id: string): Promise<Guest | undefined> {
    const [guest] = await db
      .select()
      .from(guests)
      .where(eq(guests.id, id))
      .limit(1);
    return guest || undefined;
  }

  async getGuestByToken(token: string): Promise<Guest | undefined> {
    const [guest] = await db
      .select()
      .from(guests)
      .where(eq(guests.checkInToken, token))
      .limit(1);
    return guest || undefined;
  }

  async getGuestByEmail(email: string): Promise<Guest | undefined> {
    const [guest] = await db
      .select()
      .from(guests)
      .where(eq(guests.email, email))
      .limit(1);
    return guest || undefined;
  }

  async updateGuest(id: string, data: Partial<InsertGuest>): Promise<Guest | undefined> {
    const [updated] = await db
      .update(guests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(guests.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteGuest(id: string): Promise<void> {
    await db.delete(guests).where(eq(guests.id, id));
  }

  // Guest attendance operations
  async getGuestAttendanceToday(guestId: string): Promise<Attendance | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [record] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.guestId, guestId),
          eq(attendance.date, today)
        )
      )
      .limit(1);
    return record || undefined;
  }

  async getGuestAttendanceHistory(guestId: string): Promise<Attendance[]> {
    return db
      .select()
      .from(attendance)
      .where(eq(attendance.guestId, guestId))
      .orderBy(desc(attendance.date));
  }

  // Cleanup expired guests (for cron job)
  async cleanupExpiredGuests(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(guests)
      .where(sql`${guests.expiresAt} < ${now}`)
      .returning();
    return result.length;
  }
}

export const storage = new DatabaseStorage();
