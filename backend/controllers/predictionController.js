const axios = require('axios');
const mongoose = require('mongoose');
const mongoose = require('mongoose');

// Helper: retry small number of times for transient AI service failures
async function retry(fn, attempts = 3, delayMs = 500) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

const computeLocalHeuristic = (candidates) => {
  // weights per spec: likes 0.3, shares 0.25, comments 0.2, sentiment 0.15, unique_users 0.1
  const weights = { likes: 0.3, shares: 0.25, comments_count: 0.2, avg_sentiment: 0.15, unique_users: 0.1 };
  const preds = candidates.map((c) => {
    const s = (c.likes || 0) * weights.likes + (c.shares || 0) * weights.shares + (c.comments_count || 0) * weights.comments_count + (c.avg_sentiment || 0) * weights.avg_sentiment + (c.unique_users || 0) * weights.unique_users;
    return { candidate_id: c.candidate_id, name: c.name, raw_score: s };
  });
  const total = preds.reduce((a, b) => a + Math.max(b.raw_score, 0), 0) || 1;
  const predictions = preds.map((p) => ({ ...p, predicted_pct: (Math.max(p.raw_score, 0) / total) * 100 }));
  return { predictions, usedFallback: true, model_meta: null };
};

const getPrediction = async (req, res) => {
  const electionId = req.params.electionId;
  if (!electionId) return res.status(400).json({ error: 'missing electionId' });

  const AI_URL = process.env.AI_PREDICTION_URL || 'http://localhost:8000/predict';

  try {
    const db = mongoose.connection.db;
    const candidatesCol = db.collection('candidates');
    const postsCol = db.collection('posts');
    const reactionsCol = db.collection('reactions');
    const commentsCol = db.collection('comments');

    const candidates = await candidatesCol.find({ election_id: electionId }).toArray();
    const payload = { election_id: electionId, candidates: [] };

    for (const c of candidates) {
      const cid = c._id.toString();
      const name = c.name || c.fullName || c.title || '';
      const posts = await postsCol.find({ candidate_id: cid, election_id: electionId }, { projection: { _id: 1 } }).toArray();
      const postIds = posts.map((p) => p._id);

      const matchReactions = postIds.length ? { post_id: { $in: postIds } } : { post_id: null };

      const likes = await reactionsCol.countDocuments(Object.assign({}, matchReactions, { type: 'like' }));
      const hearts = await reactionsCol.countDocuments(Object.assign({}, matchReactions, { type: 'heart' }));
      const thumbs_up = await reactionsCol.countDocuments(Object.assign({}, matchReactions, { type: 'thumbs_up' }));
      const thumbs_down = await reactionsCol.countDocuments(Object.assign({}, matchReactions, { type: 'thumbs_down' }));
      const support = await reactionsCol.countDocuments(Object.assign({}, matchReactions, { type: 'support' }));
      const shares = await reactionsCol.countDocuments(Object.assign({}, matchReactions, { type: 'share' }));

      const comments_count = postIds.length ? await commentsCol.countDocuments({ post_id: { $in: postIds } }) : 0;

      const agg = postIds.length ? await commentsCol.aggregate([
        { $match: { post_id: { $in: postIds } } },
        { $group: { _id: null, avgSent: { $avg: '$sentiment' } } }
      ]).toArray() : [];
      const avg_sentiment = (agg && agg[0] && agg[0].avgSent) ? agg[0].avgSent : 0.0;

      const unique_users_ag = postIds.length ? await reactionsCol.aggregate([
        { $match: { post_id: { $in: postIds } } },
        { $group: { _id: '$user_id' } },
        { $count: 'unique' }
      ]).toArray() : [];
      const unique_users = (unique_users_ag && unique_users_ag[0]) ? unique_users_ag[0].unique : 0;

      const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
      const last24Count = postIds.length ? await reactionsCol.countDocuments({ post_id: { $in: postIds }, timestamp: { $gte: cutoff } }) : 0;

      payload.candidates.push({
        candidate_id: cid,
        name,
        likes,
        hearts,
        thumbs_up,
        thumbs_down,
        support,
        shares,
        comments_count,
        avg_sentiment: avg_sentiment || 0.0,
        unique_users,
        last24_reaction_delta: last24Count,
      });
    }

    // Ensure we have candidate feature rows
    if (!payload.candidates || payload.candidates.length === 0) {
      return res.status(404).json({ message: 'No candidate engagement found for this election' });
    }

    // Call AI service (POST /predict expects either candidates payload or election_id in body)
    try {
      const resp = await retry(() => axios.post(AI_URL, { election_id: electionId }), 3, 300);
      const out = resp.data;
      // emit via socket if available
      try {
        const io = req.app.get('io');
        if (io) io.to(`election_${electionId}`).emit('prediction:update', out);
      } catch (e) {
        // ignore emit failures
      }
      return res.json(out);
    } catch (err) {
      console.warn('AI service call failed, using local heuristic', err.message || err);
      const out = computeLocalHeuristic(payload.candidates);
      try {
        const io = req.app.get('io');
        if (io) io.to(`election_${electionId}`).emit('prediction:update', out);
      } catch (e) {}
      return res.json(out);
    }
  } catch (err) {
    console.error('prediction error', err.message || err);
    return res.status(500).json({ error: 'prediction failed', details: err.message || err });
  }
};

const predictPublic = async (req, res) => {
  // Public polling endpoint used by frontend
  const electionId = req.params.electionId;
  if (!electionId) return res.status(400).json({ error: 'missing electionId' });
  // Delegate to getPrediction for now (keeps logic in one place)
  return getPrediction(req, res);
};

module.exports = { getPrediction, predictPublic };
