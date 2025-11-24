module.exports = async function (db) {
  console.log('003_backfill_candidates: Linking orphaned candidates to elections or archiving');
  const candidates = db.collection('candidates');
  const posts = db.collection('posts');

  const cursor = candidates.find({ $or: [{ election_id: { $exists: false } }, { election: { $exists: false } }] });
  let linked = 0;
  let archived = 0;
  while (await cursor.hasNext()) {
    const c = await cursor.next();
    // Find posts authored by candidate
    const candidateIdStr = c._id.toString();
    const post = await posts.findOne({ $or: [{ candidate: c._id }, { author: c._id }, { candidate_id: candidateIdStr }, { author: candidateIdStr }] });
    if (post && (post.election_id || post.election)) {
      const update = {
        election_id: post.election_id || (post.election ? post.election.toString() : undefined),
      };
      if (post.election) update.election = post.election;
      await candidates.updateOne({ _id: c._id }, { $set: update });
      linked++;
    } else {
      // soft-archive: mark archived=true so admin can review
      await candidates.updateOne({ _id: c._id }, { $set: { archived: true } });
      archived++;
    }
  }
  console.log(`003_backfill_candidates: linked=${linked}, archived=${archived}`);
};
