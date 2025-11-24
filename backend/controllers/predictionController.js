const axios = require("axios");
const mongoose = require("mongoose");

const asObjectIdOrNull = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

// ---- Local Heuristic Fallback ------------------------------------------------
function computeLocalHeuristic(candidates) {
  // Same weights you specified
  const weights = {
    likes: 0.3,
    shares: 0.25,
    comments_count: 0.2,
    avg_sentiment: 0.15,
    unique_users: 0.1,
  };

  const preds = candidates.map((c) => {
    const s =
      (c.likes || 0) * weights.likes +
      (c.shares || 0) * weights.shares +
      (c.comments_count || 0) * weights.comments_count +
      (c.avg_sentiment || 0) * weights.avg_sentiment +
      (c.unique_users || 0) * weights.unique_users;
    return {
      candidate_id: c.candidate_id,
      name: c.name,
      raw_score: Number.isFinite(s) ? s : 0,
    };
  });

  const total = preds.reduce((acc, p) => acc + Math.max(p.raw_score, 0), 0) || 1;
  const predictions = preds
    .map((p) => ({
      candidate_id: p.candidate_id,
      name: p.name,
      predicted_pct: (Math.max(p.raw_score, 0) / total) * 100,
    }))
    .sort((a, b) => b.predicted_pct - a.predicted_pct);

  return {
    electionId: null, // filled by caller
    computedAt: new Date().toISOString(),
    usedFallback: true,
    model_meta: null,
    totals: { candidates: predictions.length },
    predictions,
  };
}

// ---- Small retry helper ------------------------------------------------------
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

// ---- Core data builder: reads engagement & builds AI payload -----------------
async function buildEngagementPayload(db, electionId) {
  const candidatesCol = db.collection("candidates");
  const postsCol = db.collection("posts");
  const reactionsCol = db.collection("reactions");
  const commentsCol = db.collection("comments");

  const oid = asObjectIdOrNull(electionId);

  // Support both schemas:
  // - ObjectId ref: { election: ObjectId(...) }
  // - String field: { election_id: "<id>" }
  const candidateQuery = oid
    ? { $or: [{ election: oid }, { election_id: electionId }] }
    : { election_id: electionId };

  const candidates = await candidatesCol.find(candidateQuery).toArray();

  const payload = { election_id: electionId, candidates: [] };
  if (!candidates.length) return payload;

  for (const c of candidates) {
    const cid = String(c._id);
    const name = c.name || c.fullName || c.title || "";

    // Posts for this candidate in this election (support both schemas again)
    const postQueryBase = [{ candidate_id: cid }];
    if (oid) {
      postQueryBase.push({ election: oid });
    }
    postQueryBase.push({ election_id: electionId });

    const posts = await postsCol
      .find({ $and: [{ candidate_id: cid }, { $or: postQueryBase }] }, { projection: { _id: 1 } })
      .toArray();

    const postIds = posts.map((p) => p._id);
    const matchReactions = postIds.length ? { post_id: { $in: postIds } } : { post_id: null };

    // Reaction counts
    const [
      likes,
      hearts,
      thumbs_up,
      thumbs_down,
      support,
      shares,
      comments_count,
      avgSentAgg,
      uniqueUsersAgg,
      last24Count,
    ] = await Promise.all([
      reactionsCol.countDocuments({ ...matchReactions, type: "like" }),
      reactionsCol.countDocuments({ ...matchReactions, type: "heart" }),
      reactionsCol.countDocuments({ ...matchReactions, type: "thumbs_up" }),
      reactionsCol.countDocuments({ ...matchReactions, type: "thumbs_down" }),
      reactionsCol.countDocuments({ ...matchReactions, type: "support" }),
      reactionsCol.countDocuments({ ...matchReactions, type: "share" }),
      postIds.length
        ? commentsCol.countDocuments({ post_id: { $in: postIds } })
        : 0,
      postIds.length
        ? commentsCol
            .aggregate([
              { $match: { post_id: { $in: postIds } } },
              { $group: { _id: null, avgSent: { $avg: "$sentiment" } } },
            ])
            .toArray()
        : [],
      postIds.length
        ? reactionsCol
            .aggregate([
              { $match: { post_id: { $in: postIds } } },
              { $group: { _id: "$user_id" } },
              { $count: "unique" },
            ])
            .toArray()
        : [],
      (async () => {
        if (!postIds.length) return 0;
        const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
        return reactionsCol.countDocuments({
          post_id: { $in: postIds },
          timestamp: { $gte: cutoff },
        });
      })(),
    ]);

    const avg_sentiment =
      Array.isArray(avgSentAgg) && avgSentAgg[0] && Number.isFinite(avgSentAgg[0].avgSent)
        ? Number(avgSentAgg[0].avgSent)
        : 0;

    const unique_users =
      Array.isArray(uniqueUsersAgg) && uniqueUsersAgg[0] && Number.isFinite(uniqueUsersAgg[0].unique)
        ? Number(uniqueUsersAgg[0].unique)
        : 0;

    payload.candidates.push({
      candidate_id: cid,
      name,
      likes: Number(likes) || 0,
      hearts: Number(hearts) || 0,
      thumbs_up: Number(thumbs_up) || 0,
      thumbs_down: Number(thumbs_down) || 0,
      support: Number(support) || 0,
      shares: Number(shares) || 0,
      comments_count: Number(comments_count) || 0,
      avg_sentiment,
      unique_users,
      last24_reaction_delta: Number(last24Count) || 0,
    });
  }

  return payload;
}

// ---- Controller: internal (AI + fallback) -----------------------------------
async function getPrediction(req, res) {
  const electionId = req.params.electionId;
  if (!electionId) return res.status(400).json({ error: 'missing electionId' });

  // Role-based: do not serve prediction to candidate accounts
  if (req.user && req.user.role === 'candidate') {
    return res.status(204).send();
  }

  try {
    const payload = await require('../services/predictionPollService').buildElectionPrediction({ electionId });

    // Best-effort emit to socket room for connected clients
    try {
      const io = req.app.get('io');
      if (io) {
        const room = `prediction:${electionId}`;
        io.to(room).emit('prediction:update', payload);
      }
    } catch (e) {
      console.warn('Failed to emit prediction:update via socket:', e?.message || e);
    }

    if (!payload || !payload.candidates || payload.candidates.length === 0) {
      return res.status(404).json({ message: 'No candidate engagement found for this election' });
    }

    return res.json(payload);
  } catch (err) {
    console.error('prediction error:', err.message || err);
    return res.status(500).json({ error: 'prediction failed', details: err.message || err });
  }
}

// ---- Controller: public endpoint wrapper ------------------------------------
async function getPublicPrediction(req, res) {
  // For now, simply delegate to the main function to keep logic in one place.
  return getPrediction(req, res);
}

module.exports = { getPrediction, getPublicPrediction };
