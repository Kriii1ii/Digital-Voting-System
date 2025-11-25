/**
 * Replace candidates for an election with the five named candidates used by the mock simulator.
 * Usage: MONGO_URI="mongodb://..." node scripts/seed_candidates_five.js <electionId>
 */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_voting';
const electionId = process.argv[2] || 'mock-election';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;

  // Use string _id values that match the mock simulator candidate IDs
  const candidates = [
    { _id: 'prapti', candidate_id: 'prapti', name: 'Prapti Baral', election_id: electionId, initialVotes: 1000 },
    { _id: 'astha', candidate_id: 'astha', name: 'Astha Ghimire', election_id: electionId, initialVotes: 850 },
    { _id: 'max', candidate_id: 'max', name: 'Max Acharya', election_id: electionId, initialVotes: 700 },
    { _id: 'lewis', candidate_id: 'lewis', name: 'Lewis Shrestha', election_id: electionId, initialVotes: 950 },
    { _id: 'rabina', candidate_id: 'rabina', name: 'Rabina Shah', election_id: electionId, initialVotes: 600 },
  ];

  // remove existing candidates for this election
  await db.collection('candidates').deleteMany({ election_id: electionId });

  // insert new candidates
  await db.collection('candidates').insertMany(candidates);

  console.log(`Replaced candidates for election=${electionId} with 5 mock candidates`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
