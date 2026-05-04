#!/usr/bin/env node
/**
 * Ensures a default super-admin exists. Safe to run multiple times.
 * Usage (from backend folder): node scripts/ensure-admin.js
 *
 * Loads MONGODB_URI from .env or .env.example; default admin: admin@gosellr.com / admin123
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Prefer .env, fallback to tracked template
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.example') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosellr';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'seller', 'rider', 'admin', 'super-admin'], default: 'customer' },
    status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending'], default: 'active' },
    authSource: { type: String, enum: ['local', 'idp'], default: 'local' },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'users' }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    const exists = await User.exists({ role: 'super-admin' });
    if (exists) {
      console.log('✅ A super-admin already exists. No change.');
      process.exit(0);
      return;
    }
    const hashed = await bcrypt.hash('admin123', 12);
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@gosellr.com',
      phone: '+1234567890',
      password: hashed,
      role: 'super-admin',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
    });
    console.log('✅ Default admin created: admin@gosellr.com / admin123');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
