import { hash } from 'bcrypt-ts';

const password = 'User@123';
const hashedPassword = await hash(password, 10);

console.log('Password hash:', hashedPassword);
console.log('\nRun this SQL to update the admin password:');
console.log(`UPDATE "User" SET password = '${hashedPassword}' WHERE email = 'admin@gmail.com';`);
