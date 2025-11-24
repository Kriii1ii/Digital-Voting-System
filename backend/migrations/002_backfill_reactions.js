module.exports = async function (db) {
  console.log('002_backfill_reactions: Backfilling reactions with post_id, election_id, candidate_id');
  const reactions = db.collection('reactions');
  const posts = db.collection('posts');

  const cursor = reactions.find({ $or: [{ post_id: { $exists: false } }, { election_id: { $exists: false } }, { candidate_id: { $exists: false } }] });
  let updated = 0;
  while (await cursor.hasNext()) {
    const r = await cursor.next();
    const update = {};
    if (!r.post_id && r.post) {
      try { update.post_id = r.post.toString(); } catch (e) {}
    }
    if ((!r.election_id || !r.candidate_id) && (r.post || r.post_id)) {
      const pid = r.post_id || (r.post ? r.post.toString() : null);
      if (pid) {
        const post = await posts.findOne({ _id: typeof pid === 'string' ? new require('mongodb').ObjectId(pid) : pid });
        if (post) {
          if (!r.election_id && (post.election_id || post.election)) {
            update.election_id = post.election_id || (post.election ? post.election.toString() : undefined);
          }
          if (!r.candidate_id && (post.candidate_id || post.candidate || post.author)) {
            update.candidate_id = post.candidate_id || (post.candidate ? post.candidate.toString() : (post.author ? post.author.toString() : undefined));
          }
        }
      }
    }
    if (Object.keys(update).length) {
      await reactions.updateOne({ _id: r._id }, { $set: update });
      updated++;
    }
  }
  console.log(`002_backfill_reactions: updated ${updated} reactions`);
};
