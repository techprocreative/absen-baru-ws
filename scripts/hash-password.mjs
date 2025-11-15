import { hash } from '@node-rs/bcrypt';

const password = 'Admin123!';
const saltRounds = 10;

try {
  const passwordHash = await hash(password, saltRounds);
  
  console.log('\n===========================================');
  console.log('ADMIN PASSWORD HASH GENERATED');
  console.log('===========================================');
  console.log('\nPassword:', password);
  console.log('\nHash:', passwordHash);
  console.log('\n===========================================');
  console.log('SQL untuk Supabase SQL Editor:');
  console.log('===========================================\n');
  
  const sql = `INSERT INTO employees (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@facesenseattend.com',
  '${passwordHash}',
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
  updated_at = now();`;
  
  console.log(sql);
  console.log('\n===========================================');
  console.log('SECURITY WARNING:');
  console.log('Change this password after first login!');
  console.log('===========================================\n');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}