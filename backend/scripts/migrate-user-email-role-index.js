/**
 * One-time migration: switch from unique email to unique compound (email + role).
 *
 * Run from backend folder: node scripts/migrate-user-email-role-index.js
 *
 * Requires MONGODB_URI in .env (same as the Nest app).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error('Set MONGODB_URI in .env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const coll = db.collection('users');

  try {
    await coll.dropIndex('email_1');
    console.log('Dropped index email_1');
  } catch (e) {
    console.log('Could not drop email_1 (may not exist):', e.message);
  }

  try {
    await coll.createIndex({ email: 1, role: 1 }, { unique: true, name: 'email_1_role_1' });
    console.log('Created unique compound index { email: 1, role: 1 }');
  } catch (e) {
    console.error('createIndex failed:', e.message);
    console.error('If duplicate emails exist with different roles, resolve data first.');
    process.exitCode = 1;
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
