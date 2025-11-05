require('dotenv').config({ path: process.env.ENV_PATH || '.env' });
const mongoose = require('mongoose');

// Robust import in case the model was exported differently
let Imported = require('../models/User');
const User = Imported?.default || Imported?.User || Imported;

if (!User || typeof User.findOne !== 'function') {
  console.error('❌ ../models/User did not export a Mongoose model. Got:', Imported);
  process.exit(1);
}

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/NayaMatDb';
// If you set MONGODB_DB, it will override the db name in the URI. If not set, the db name in URI is used.
const dbName = process.env.MONGODB_DB || undefined;

async function upsertUser({ fullName, email, password, role, phone }) {
  const existing = await User.findOne({ email }).select('_id role').lean();
  if (existing) {
    console.log(`✔ Exists: ${email} (role: ${existing.role})`);
    return;
  }
  const u = new User({ fullName, email, password, role, phone });
  try {
    await u.save();
    console.log(`➕ Created: ${email} (role: ${role})`);
  } catch (err) {
    console.error(`❌ Failed to create ${email}:`, err?.message || err);
    throw err;
  }
}

(async () => {
  try {
    const connectOpts = {};
    if (dbName) connectOpts.dbName = dbName;

    await mongoose.connect(uri, connectOpts);

    // Log exactly where we’re connected
    const c = mongoose.connection;
    console.log('Connected to MongoDB');
    console.log('→ host:', c.host, 'port:', c.port, 'db:', c.name);
    // Also log the collection name the model writes to
    console.log('→ collection:', User.collection.collectionName);

    // Seed users
    await upsertUser({
      fullName: 'System Administrator',
      email: 'admin@dvs.local',
      password: 'ChangeMeAdmin#1',
      role: 'admin',
      phone: '9800000000'
    });

    await upsertUser({
      fullName: 'Electoral Committee',
      email: 'committee@dvs.local',
      password: 'ChangeMeCommittee#1',
      role: 'committee',
      phone: '9800000001'
    });

    // 🔎 Read-back verification (guarantees we wrote to THIS db/collection)
    const docs = await User.find({
      email: { $in: ['admin@dvs.local', 'committee@dvs.local'] }
    }).select('email role createdAt').lean();

    console.log('Read-back found:', docs);

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
