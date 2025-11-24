const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_voting';

async function run() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;

  console.log('Running migrations...');
  try {
    await require('./001_backfill_posts')(db);
    await require('./002_backfill_reactions')(db);
    await require('./003_backfill_candidates')(db);
    await require('./004_add_constraints')(db);
    console.log('All migrations completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  }
}

if (require.main === module) run();

module.exports = run;
