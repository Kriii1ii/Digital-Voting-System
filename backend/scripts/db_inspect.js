const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const Election = require('../models/Election');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_voting';

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO_URI);

  console.log('\n1) Candidates missing election_id:');
  const missing = await Candidate.find({ $or: [{ election_id: { $exists: false } }, { election_id: null }] }).lean();
  console.log('Count:', missing.length);
  missing.slice(0, 50).forEach(c => console.log(c._id.toString(), c.fullName || c.name));

  console.log('\n2) Candidates referencing non-existent elections:');
  const all = await Candidate.find({ election_id: { $exists: true, $ne: null } }).lean();
  const bad = [];
  for (const c of all) {
    const exists = await Election.findOne({ $or: [{ _id: c.election }, { _id: mongoose.Types.ObjectId.isValid(c.election_id) ? mongoose.Types.ObjectId(c.election_id) : null }, { _id: c.election } ] }).lean();
    if (!exists) bad.push(c);
  }
  console.log('Count referencing missing elections:', bad.length);
  bad.slice(0, 50).forEach(c => console.log(c._id.toString(), c.fullName || c.name, '=>', c.election_id));

  console.log('\n3) Candidate -> Election relationships (sample):');
  const sample = await Candidate.find().limit(50).lean();
  sample.forEach(c => console.log(c._id.toString(), 'election_id=', c.election_id || null));

  await mongoose.disconnect();
}

if (require.main === module) run().catch(err => { console.error(err); process.exit(1); });
