-- Rollback migration for guest support
-- This reverts all changes from 0001_add_guest_support.sql

-- Remove trigger
DROP TRIGGER IF EXISTS guests_updated_at_trigger ON guests;
DROP FUNCTION IF EXISTS update_guests_updated_at();

-- Remove indexes
DROP INDEX IF EXISTS idx_attendance_guest_date;
DROP INDEX IF EXISTS idx_attendance_date_guest;
DROP INDEX IF EXISTS idx_attendance_guest_id;
DROP INDEX IF EXISTS idx_guests_last_activity;
DROP INDEX IF EXISTS idx_guests_expires_at;
DROP INDEX IF EXISTS idx_guests_token;
DROP INDEX IF EXISTS idx_guests_email;

-- Remove constraints
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_user_or_guest_check;
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS fk_attendance_guest;

-- Restore user_id as NOT NULL
UPDATE attendance SET user_id = '00000000-0000-0000-0000-000000000000' WHERE user_id IS NULL;
ALTER TABLE attendance ALTER COLUMN user_id SET NOT NULL;

-- Remove guest_id column
ALTER TABLE attendance DROP COLUMN IF EXISTS guest_id;

-- Drop guests table
DROP TABLE IF EXISTS guests;