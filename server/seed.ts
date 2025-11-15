import { db } from "./db";
import { users, departments } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(users);
  await db.delete(departments);

  // Create departments
  const deptData = [
    { name: "Engineering", description: "Software development team" },
    { name: "Sales", description: "Sales and business development" },
    { name: "Marketing", description: "Marketing and communications" },
    { name: "Operations", description: "Operations and logistics" },
    { name: "HR", description: "Human resources" },
  ];

  const createdDepts = await db.insert(departments).values(deptData).returning();
  console.log(`Created ${createdDepts.length} departments`);

  // Create seed users
  const seedUsers = [
    {
      email: "admin@example.com",
      password: "admin123",
      name: "Admin User",
      employeeId: "EMP001",
      role: "admin" as const,
      status: "active" as const,
      departmentId: createdDepts[4].id, // HR department
      joinDate: "2024-01-01",
    },
    {
      email: "hr@example.com",
      password: "hr123",
      name: "HR Manager",
      employeeId: "EMP002",
      role: "hr" as const,
      status: "active" as const,
      departmentId: createdDepts[4].id, // HR department
      joinDate: "2024-01-01",
    },
    {
      email: "employee@example.com",
      password: "emp123",
      name: "John Doe",
      employeeId: "EMP003",
      role: "employee" as const,
      status: "active" as const,
      departmentId: createdDepts[0].id, // Engineering
      joinDate: "2024-01-15",
    },
    {
      email: "jane.smith@example.com",
      password: "emp123",
      name: "Jane Smith",
      employeeId: "EMP004",
      role: "employee" as const,
      status: "active" as const,
      departmentId: createdDepts[0].id, // Engineering
      joinDate: "2024-02-01",
    },
    {
      email: "bob.wilson@example.com",
      password: "emp123",
      name: "Bob Wilson",
      employeeId: "EMP005",
      role: "employee" as const,
      status: "active" as const,
      departmentId: createdDepts[1].id, // Sales
      joinDate: "2024-02-15",
    },
  ];

  const createdUsers = await db.insert(users).values(seedUsers).returning();
  console.log(`Created ${createdUsers.length} users`);

  console.log("\nTest credentials:");
  console.log("Admin: admin@example.com / admin123");
  console.log("HR: hr@example.com / hr123");
  console.log("Employee: employee@example.com / emp123");
}

seed()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
