-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_guest_date ON attendance(guest_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Guest indexes
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_expires_at ON guests(expires_at);
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(check_in_token);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- Cleanup optimization
CREATE INDEX IF NOT EXISTS idx_guests_cleanup ON guests(expires_at) WHERE expires_at < NOW();
