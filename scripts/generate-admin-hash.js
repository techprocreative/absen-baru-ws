// Generate bcrypt hash for admin password
import bcrypt from 'bcrypt';

const password = 'Admin123!';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('\n===========================================');
  console.log('ADMIN PASSWORD HASH GENERATED');
  console.log('===========================================');
  console.log('\nPassword:', password);
  console.log('\nBcrypt Hash:');
  console.log(hash);
  console.log('\n===========================================');
  console.log('\nCopy this SQL to Supabase SQL Editor:');
  console.log('===========================================\n');
  
  const sql = `
INSERT INTO employees (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@facesenseattend.com',
  '${hash}',
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
`;
  
  console.log(sql);
  console.log('\n===========================================');
  console.log('SECURITY WARNING:');
  console.log('Change this password after first login!');
  console.log('===========================================\n');
});