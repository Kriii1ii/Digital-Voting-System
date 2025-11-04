/**
 * Simple script to seed mock posts, reactions, and comments for testing.
 * Usage: MONGO_URI="mongodb://..." node scripts/seed_mock_engagement.js <electionId>
 */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_voting';
const electionId = process.argv[2] || 'test-election-1';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;

  const candidates = [
    { _id: uuidv4(), name: 'Alice', election_id: electionId },
    { _id: uuidv4(), name: 'Bob', election_id: electionId },
    { _id: uuidv4(), name: 'Carol', election_id: electionId },
  ];

  await db.collection('candidates').insertMany(candidates);

  const posts = [];
  for (const c of candidates) {
    for (let i = 0; i < 3; i++) {
      posts.push({ _id: uuidv4(), candidate_id: c._id, election_id: electionId, content: `Post ${i} for ${c.name}`, created_at: new Date() });
    }
  }
  await db.collection('posts').insertMany(posts);

  const reactions = [];
  const reactionTypes = ['like', 'heart', 'thumbs_up', 'thumbs_down', 'support', 'share'];
  for (const p of posts) {
    // create between 1 and 10 reactions
    const n = Math.floor(Math.random() * 8) + 1;
    for (let i = 0; i < n; i++) {
      reactions.push({
        _id: uuidv4(),
        post_id: p._id,
        user_id: `user-${Math.floor(Math.random() * 50)}`,
        type: reactionTypes[Math.floor(Math.random() * reactionTypes.length)],
        timestamp: new Date(),
      });
    }
  }
  await db.collection('reactions').insertMany(reactions);

  const comments = [];
  for (const p of posts) {
    const nc = Math.floor(Math.random() * 4);
    for (let i = 0; i < nc; i++) {
      const sentiment = Math.random() * 2 - 1; // -1..1
      comments.push({
        _id: uuidv4(),
        post_id: p._id,
        user_id: `user-${Math.floor(Math.random() * 50)}`,
        text: `Comment ${i}`,
        sentiment,
        created_at: new Date(),
      });
    }
  }
  if (comments.length) await db.collection('comments').insertMany(comments);

  // Insert election_results labels for training (ensure they sum to ~100)
  const electionResults = [];
  const pct = [50, 30, 20];
  for (let i = 0; i < candidates.length; i++) {
    electionResults.push({
      _id: uuidv4(),
      election_id: electionId,
      candidate_id: candidates[i]._id,
      actual_pct: pct[i],
    });
  }
  await db.collection('election_results').insertMany(electionResults);

  console.log('Seeded candidates, posts, reactions, comments for election:', electionId);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
