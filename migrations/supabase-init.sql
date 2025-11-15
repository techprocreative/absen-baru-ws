-- =====================================================
-- FACESENSEATTEND - SUPABASE INITIALIZATION SCRIPT
-- =====================================================
-- This script combines all migrations for easy deployment
-- Execute this in Supabase SQL Editor
-- =====================================================

-- MIGRATION 0000: Initial Schema
-- =====================================================

DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('employee', 'hr', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "role" DEFAULT 'employee' NOT NULL,
	"face_descriptor" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"check_in" timestamp NOT NULL,
	"check_out" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" USING btree ("expire");

-- =====================================================
-- MIGRATION 0001: Add Guest Support
-- =====================================================

DO $$ BEGIN
 CREATE TYPE "public"."user_type" AS ENUM('employee', 'guest');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"company" text,
	"purpose" text NOT NULL,
	"face_descriptor" jsonb NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guests_email_unique" UNIQUE("email"),
	CONSTRAINT "guests_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "guest_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"guest_id" integer NOT NULL,
	"check_in" timestamp NOT NULL,
	"check_out" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "guest_attendance" ADD CONSTRAINT "guest_attendance_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "user_type" "user_type" DEFAULT 'employee' NOT NULL;

-- =====================================================
-- MIGRATION 0002: Add Performance Indexes
-- =====================================================

-- Indexes for employees table
CREATE INDEX IF NOT EXISTS "idx_employees_email" ON "employees" USING btree ("email");
CREATE INDEX IF NOT EXISTS "idx_employees_is_active" ON "employees" USING btree ("is_active");
CREATE INDEX IF NOT EXISTS "idx_employees_role" ON "employees" USING btree ("role");
CREATE INDEX IF NOT EXISTS "idx_employees_created_at" ON "employees" USING btree ("created_at");

-- Indexes for attendance table
CREATE INDEX IF NOT EXISTS "idx_attendance_employee_id" ON "attendance" USING btree ("employee_id");
CREATE INDEX IF NOT EXISTS "idx_attendance_check_in" ON "attendance" USING btree ("check_in");
CREATE INDEX IF NOT EXISTS "idx_attendance_check_out" ON "attendance" USING btree ("check_out");
CREATE INDEX IF NOT EXISTS "idx_attendance_user_type" ON "attendance" USING btree ("user_type");
CREATE INDEX IF NOT EXISTS "idx_attendance_created_at" ON "attendance" USING btree ("created_at");

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS "idx_attendance_employee_checkin" ON "attendance" USING btree ("employee_id", "check_in" DESC);

-- Indexes for guests table
CREATE INDEX IF NOT EXISTS "idx_guests_email" ON "guests" USING btree ("email");
CREATE INDEX IF NOT EXISTS "idx_guests_token" ON "guests" USING btree ("token");
CREATE INDEX IF NOT EXISTS "idx_guests_is_active" ON "guests" USING btree ("is_active");
CREATE INDEX IF NOT EXISTS "idx_guests_created_at" ON "guests" USING btree ("created_at");

-- Indexes for guest_attendance table
CREATE INDEX IF NOT EXISTS "idx_guest_attendance_guest_id" ON "guest_attendance" USING btree ("guest_id");
CREATE INDEX IF NOT EXISTS "idx_guest_attendance_check_in" ON "guest_attendance" USING btree ("check_in");
CREATE INDEX IF NOT EXISTS "idx_guest_attendance_check_out" ON "guest_attendance" USING btree ("check_out");
CREATE INDEX IF NOT EXISTS "idx_guest_attendance_created_at" ON "guest_attendance" USING btree ("created_at");

-- Composite index for common guest queries
CREATE INDEX IF NOT EXISTS "idx_guest_attendance_guest_checkin" ON "guest_attendance" USING btree ("guest_id", "check_in" DESC);

-- =====================================================
-- SCRIPT COMPLETE
-- =====================================================
-- All migrations have been applied successfully
-- You can now verify the schema in Supabase Dashboard
-- =====================================================