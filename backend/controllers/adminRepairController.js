const mongoose = require('mongoose');

const Candidate = require('../models/Candidate');
const Post = require('../models/Post');

async function repairOrphanCandidates(req, res) {
  try {
    // Find candidates missing election reference
    const orphans = await Candidate.find({ $or: [{ election: { $exists: false } }, { election: null }, { election_id: { $exists: false } }] }).lean();
    let linked = 0;
    let archived = 0;
    for (const c of orphans) {
      const post = await Post.findOne({ $or: [{ candidate: c._id }, { author: c._id }, { candidate_id: c._id.toString() }] }).lean();
      if (post && (post.election || post.election_id)) {
        c.election = post.election || null;
        c.election_id = post.election_id || (post.election ? post.election.toString() : null);
        await Candidate.updateOne({ _id: c._id }, { $set: { election: c.election, election_id: c.election_id } });
        linked++;
      } else {
        await Candidate.updateOne({ _id: c._id }, { $set: { archived: true } });
        archived++;
      }
    }
    return res.json({ success: true, repaired: linked, archived });
  } catch (err) {
    console.error('repairOrphanCandidates error', err);
    return res.status(500).json({ success: false, error: err.message || err });
  }
}

module.exports = { repairOrphanCandidates };
