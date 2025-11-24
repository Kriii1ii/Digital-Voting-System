module.exports = async function (db) {
  console.log('001_backfill_posts: Backfilling posts with election_id and candidate_id where missing');
  const posts = db.collection('posts');

  const cursor = posts.find({ $or: [{ election_id: { $exists: false } }, { candidate_id: { $exists: false } }] });
  let updated = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const update = {};
    if (!doc.election_id && doc.election) {
      try { update.election_id = doc.election.toString(); } catch (e) {}
    }
    if (!doc.candidate_id) {
      if (doc.candidate) update.candidate_id = doc.candidate.toString();
      else if (doc.author) update.candidate_id = doc.author.toString();
    }
    if (Object.keys(update).length) {
      await posts.updateOne({ _id: doc._id }, { $set: update });
      updated++;
    }
  }
  console.log(`001_backfill_posts: updated ${updated} posts`);
};
