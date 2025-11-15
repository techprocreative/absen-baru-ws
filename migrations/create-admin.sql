-- =====================================================
-- CREATE ADMIN USER FOR FACESENSEATTEND
-- =====================================================
-- Execute this in Supabase SQL Editor AFTER running supabase-init.sql
-- Default credentials:
--   Email: admin@facesenseattend.com
--   Password: Admin123!
-- 
-- IMPORTANT: Change the password immediately after first login!
-- =====================================================

-- Insert admin user with bcrypt hashed password for "Admin123!"
INSERT INTO employees (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@facesenseattend.com',
  '$2b$10$YourHashWillBeGeneratedHere.PleaseRunTheHashScript',
  'System Administrator',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify the admin user was created:
SELECT id, email, full_name, role, is_active, created_at 
FROM employees 
WHERE email = 'admin@facesenseattend.com';

-- =====================================================
-- SECURITY WARNING
-- =====================================================
-- Please change this password immediately after first login!
-- Go to: Profile Settings > Change Password
-- =====================================================