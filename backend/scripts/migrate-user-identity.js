/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
const { config } = require('dotenv');

config({ path: path.join(__dirname, '..', '.env') });

const uri =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV !== 'production' ? 'mongodb://localhost:27017/gosellr' : '');
if (!uri) {
  console.error(
    'MONGODB_URI is required (or DATABASE_URL). Add it to backend/.env or set the variable in your shell.',
  );
  process.exit(1);
}
if (!process.env.MONGODB_URI && !process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  console.warn('Using dev default mongodb://localhost:27017/gosellr (no MONGODB_URI in .env).');
}

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const enforceIndex = args.has('--enforce-index');

function normEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function roleSet(user) {
  const roles = Array.isArray(user.roles) ? user.roles.filter(Boolean) : [];
  if (user.role && !roles.includes(user.role)) roles.unshift(user.role);
  return Array.from(new Set(roles));
}

function statusScore(status) {
  switch (status) {
    case 'active':
      return 4;
    case 'pending':
      return 3;
    case 'inactive':
      return 2;
    case 'suspended':
      return 1;
    default:
      return 0;
  }
}

function pickCanonical(users) {
  return [...users].sort((a, b) => {
    const scoreDiff = statusScore(b.status) - statusScore(a.status);
    if (scoreDiff !== 0) return scoreDiff;
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
    if (aDate !== bDate) return aDate - bDate;
    return String(a._id).localeCompare(String(b._id));
  })[0];
}

function preferValue(base, candidate) {
  if (base !== undefined && base !== null && String(base).trim() !== '') return base;
  if (candidate !== undefined && candidate !== null && String(candidate).trim() !== '') return candidate;
  return base;
}

async function hasDocWithUserId(collection, userId) {
  const doc = await collection.findOne({ userId });
  return !!doc;
}

async function rewireUserRefs(db, fromId, toId) {
  const sellers = db.collection('sellers');
  const riders = db.collection('riders');
  const carts = db.collection('carts');
  const customerProfiles = db.collection('customerprofiles');
  const notifications = db.collection('notifications');
  const orders = db.collection('orders');

  await sellers.updateMany({ userId: fromId }, { $set: { userId: toId } });
  await riders.updateMany({ userId: fromId }, { $set: { userId: toId } });
  await carts.updateMany({ userId: fromId }, { $set: { userId: toId } });
  await customerProfiles.updateMany({ userId: fromId }, { $set: { userId: toId } });
  await notifications.updateMany({ forUserId: fromId }, { $set: { forUserId: toId } });

  await orders.updateMany({ customer: fromId }, { $set: { customer: toId } });
  await orders.updateMany({ assignedRiderId: fromId }, { $set: { assignedRiderId: toId } });
  await orders.updateMany(
    { 'items.seller': fromId },
    { $set: { 'items.$[elem].seller': toId } },
    { arrayFilters: [{ 'elem.seller': fromId }] },
  );
}

async function migrate() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const usersCol = db.collection('users');
  const riders = db.collection('riders');
  const carts = db.collection('carts');
  const customerProfiles = db.collection('customerprofiles');

  const users = await usersCol.find({ isDeleted: { $ne: true } }).toArray();
  const byEmail = new Map();
  for (const u of users) {
    const email = normEmail(u.email);
    if (!email) continue;
    if (!byEmail.has(email)) byEmail.set(email, []);
    byEmail.get(email).push(u);
  }

  const duplicateGroups = [...byEmail.entries()].filter(([, list]) => list.length > 1);
  console.log(`Users: ${users.length}`);
  console.log(`Duplicate email groups: ${duplicateGroups.length}`);

  let mergedUsers = 0;
  const skipped = [];

  for (const [email, list] of duplicateGroups) {
    const canonical = pickCanonical(list);
    const canonicalId = canonical._id;
    const duplicates = list.filter((u) => String(u._id) !== String(canonicalId));

    const mergedRoles = Array.from(new Set(list.flatMap((u) => roleSet(u))));
    const merged = {
      firstName: canonical.firstName,
      lastName: canonical.lastName,
      phone: canonical.phone,
      avatar: canonical.avatar,
      role: canonical.role || mergedRoles[0] || 'customer',
      roles: mergedRoles.length > 0 ? mergedRoles : ['customer'],
      authSource: canonical.authSource || 'local',
      externalId: canonical.externalId,
      idpProvider: canonical.idpProvider,
      status: canonical.status || 'active',
    };

    for (const d of duplicates) {
      merged.firstName = preferValue(merged.firstName, d.firstName);
      merged.lastName = preferValue(merged.lastName, d.lastName);
      merged.phone = preferValue(merged.phone, d.phone);
      merged.avatar = preferValue(merged.avatar, d.avatar);
      merged.externalId = preferValue(merged.externalId, d.externalId);
      merged.idpProvider = preferValue(merged.idpProvider, d.idpProvider);
    }

    for (const d of duplicates) {
      const fromId = d._id;
      const riderCollision =
        (await hasDocWithUserId(riders, canonicalId)) && (await hasDocWithUserId(riders, fromId));
      const cartCollision =
        (await hasDocWithUserId(carts, canonicalId)) && (await hasDocWithUserId(carts, fromId));
      const customerCollision =
        (await hasDocWithUserId(customerProfiles, canonicalId)) &&
        (await hasDocWithUserId(customerProfiles, fromId));

      if (riderCollision || cartCollision || customerCollision) {
        skipped.push({
          email,
          duplicateId: String(fromId),
          canonicalId: String(canonicalId),
          reason: `Collision on unique profile docs: rider=${riderCollision} cart=${cartCollision} customer=${customerCollision}`,
        });
        continue;
      }

      if (apply) {
        await rewireUserRefs(db, fromId, canonicalId);
        await usersCol.deleteOne({ _id: fromId });
      }
    }

    if (apply) {
      await usersCol.updateOne(
        { _id: canonicalId },
        {
          $set: {
            email,
            firstName: merged.firstName,
            lastName: merged.lastName,
            phone: merged.phone,
            avatar: merged.avatar,
            role: merged.role,
            roles: merged.roles,
            authSource: merged.authSource,
            externalId: merged.externalId,
            idpProvider: merged.idpProvider,
            status: merged.status,
          },
        },
      );
    }

    mergedUsers += 1;
    console.log(`[${apply ? 'APPLY' : 'DRY'}] ${email}: keep=${canonicalId} merge=${duplicates.length}`);
  }

  const remainingDuplicates = await usersCol
    .aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'groups' },
    ])
    .toArray();
  const remaining = remainingDuplicates[0]?.groups || 0;

  if (enforceIndex && apply) {
    if (remaining > 0) {
      console.warn(`Skipping unique email index enforcement: ${remaining} duplicate groups remain.`);
    } else {
      const indexes = await usersCol.indexes();
      const legacy = indexes.find((i) => i.name === 'email_1_role_1');
      if (legacy) {
        await usersCol.dropIndex('email_1_role_1');
        console.log('Dropped legacy index: email_1_role_1');
      }
      const emailUnique = indexes.find((i) => i.name === 'email_1' && i.unique);
      if (!emailUnique) {
        await usersCol.createIndex({ email: 1 }, { unique: true, name: 'email_1' });
        console.log('Created unique index: email_1');
      }
    }
  }

  console.log('--- Migration Summary ---');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Groups processed: ${duplicateGroups.length}`);
  console.log(`Groups merged: ${mergedUsers}`);
  console.log(`Skipped duplicate docs: ${skipped.length}`);
  console.log(`Remaining duplicate groups: ${remaining}`);
  if (skipped.length > 0) {
    console.log('Skipped details:');
    for (const s of skipped) console.log(JSON.stringify(s));
  }

  await mongoose.disconnect();
}

migrate().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
