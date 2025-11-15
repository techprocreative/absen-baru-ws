-- Migration: Add guest attendance support
-- Created: 2024-01-15

-- Step 1: Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id VARCHAR PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  purpose TEXT NOT NULL,
  face_descriptors JSONB NOT NULL,
  descriptor_count INTEGER NOT NULL DEFAULT 5,
  check_in_token TEXT UNIQUE,
  token_expires_at TIMESTAMP,
  consent_given BOOLEAN NOT NULL DEFAULT TRUE,
  consent_timestamp TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 2: Add guest_id column to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS guest_id VARCHAR;

-- Step 3: Make user_id nullable (for guest support)
ALTER TABLE attendance ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Add foreign key constraint for guest_id
ALTER TABLE attendance 
  ADD CONSTRAINT fk_attendance_guest 
  FOREIGN KEY (guest_id) 
  REFERENCES guests(id) 
  ON DELETE CASCADE;

-- Step 5: Add check constraint (either user_id OR guest_id must be set)
ALTER TABLE attendance
  ADD CONSTRAINT attendance_user_or_guest_check 
  CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR 
    (user_id IS NULL AND guest_id IS NOT NULL)
  );

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(check_in_token);
CREATE INDEX IF NOT EXISTS idx_guests_expires_at ON guests(expires_at);
CREATE INDEX IF NOT EXISTS idx_guests_last_activity ON guests(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_attendance_guest_id ON attendance(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_date_guest ON attendance(date, guest_id) WHERE guest_id IS NOT NULL;

-- Step 7: Create unique constraint for guest attendance per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_guest_date 
  ON attendance(guest_id, date) 
  WHERE guest_id IS NOT NULL;

-- Step 8: Add trigger for updated_at on guests table
CREATE OR REPLACE FUNCTION update_guests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guests_updated_at_trigger
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_guests_updated_at();

-- Comments for documentation
COMMENT ON TABLE guests IS 'Stores temporary guest user data for face-based attendance without requiring full user accounts';
COMMENT ON COLUMN guests.face_descriptors IS 'Array of 128-dimensional face descriptor vectors for matching';
COMMENT ON COLUMN guests.expires_at IS 'Guest record auto-expires after 7 days for privacy compliance';
COMMENT ON COLUMN attendance.guest_id IS 'Reference to guest for anonymous attendance tracking';