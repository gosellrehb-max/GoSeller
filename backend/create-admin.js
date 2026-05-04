#!/usr/bin/env node
/**
 * One-time script to create (or update) an admin user in MongoDB.
 * Usage: node create-admin.js [email] [password]
 * Example: node create-admin.js admin@gosellr.com Admin@1234
 */

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosellr';

const UserSchema = new mongoose.Schema(
  {},
  { collection: 'users', timestamps: true, strict: false },
);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function main() {
  const email = (process.argv[2] || 'admin@gosellr.com').toLowerCase().trim();
  const password = process.argv[3] || 'Admin@1234';

  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
    console.error('Password must be 8+ chars with at least one uppercase letter and one number.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log(`Connected → ${mongoose.connection.name}`);

  const hashed = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email }).lean();

  if (existing) {
    // Update role fields and reset password
    await User.updateOne(
      { email },
      {
        $set: {
          role: 'admin',
          roles: ['admin'],
          status: 'active',
          password: hashed,
          authSource: 'local',
        },
      },
    );
    console.log(`✅  Updated existing user "${email}" → role: admin`);
  } else {
    const nameParts = email.split('@')[0].split(/[._-]/);
    const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Admin';

    await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      role: 'admin',
      roles: ['admin'],
      status: 'active',
      authSource: 'local',
    });
    console.log(`✅  Created new admin user "${email}"`);
  }

  console.log(`\n  Email    : ${email}`);
  console.log(`  Password : ${password}`);
  console.log(`  Role     : admin\n`);
  console.log('You can now log in at the admin panel with these credentials.');
}

main()
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
