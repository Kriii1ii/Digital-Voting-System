module.exports = async function (db) {
  console.log('004_add_constraints: Ensure indexes and constraints for new fields');
  try {
    await db.collection('candidates').createIndex({ election_id: 1 });
    await db.collection('posts').createIndex({ election_id: 1 });
    await db.collection('posts').createIndex({ candidate_id: 1 });
    await db.collection('reactions').createIndex({ election_id: 1 });
    await db.collection('reactions').createIndex({ candidate_id: 1 });
    await db.collection('pollinteractions').createIndex({ election_id: 1 });
    console.log('004_add_constraints: Indexes created/ensured');
  } catch (err) {
    console.error('004_add_constraints error:', err.message || err);
    throw err;
  }
};
