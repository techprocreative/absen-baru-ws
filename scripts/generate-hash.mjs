import bcrypt from 'bcryptjs';

const password = process.argv[2] || 'Admin123!';
const hash = bcrypt.hashSync(password, 10);

console.log('\n===========================================');
console.log('PASSWORD HASH GENERATED');
console.log('===========================================');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('===========================================\n');