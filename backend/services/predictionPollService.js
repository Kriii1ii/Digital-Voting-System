const axios = require("axios");
const mongoose = require("mongoose");

const Candidate = require("../models/candidate.js");
const Post = require("../models/Post.js");
const Reaction = require("../models/Reaction.js");
const Comment = require("../models/Comment.js");
const Election = require("../models/Election.js");

const { ObjectId } = mongoose.Types;

const AI_BASE_URL = process.env.AI_PREDICTION_URL || "http://localhost:8000";
const AI_TIMEOUT_MS = Number(process.env.AI_PREDICTION_TIMEOUT_MS || 8000);

function asObjectId(id) {
  if (!id) return null;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

async function resolveElectionId(explicitElectionId) {
  if (explicitElectionId) return explicitElectionId;

  const active = await Election.findOne({ isActive: true }).sort({ startDate: -1 }).lean();
  if (active?._id) return active._id.toString();

  const fallback = await Election.findOne().sort({ createdAt: -1 }).lean();
  return fallback?._id ? fallback._id.toString() : null;
}

function buildDirectElectionMatch(electionId, fieldName = "election") {
  if (!electionId) return {};
  const vid = asObjectId(electionId);
  const clauses = [];
  if (vid) clauses.push({ [fieldName]: vid });
  clauses.push({ [fieldName]: electionId });
  return clauses.length ? { $or: clauses } : {};
}

function buildLookupElectionMatch(electionId, path) {
  if (!electionId) return [];
  const clauses = [];
  const vid = asObjectId(electionId);
  if (vid) clauses.push({ [`${path}`]: vid });
  clauses.push({ [`${path}`]: electionId });
  clauses.push({ [`${path}_id`]: electionId });
  clauses.push({ [`${path}Id`]: electionId });
  return clauses.length ? [{ $match: { $or: clauses } }] : [];
}

async function aggregatePostsByCandidate(electionId) {
  const match = buildDirectElectionMatch(electionId);
  const pipeline = [
    Object.keys(match).length ? { $match: match } : null,
    {
      $addFields: {
        candidateRef: {
          $cond: [{ $ifNull: ["$candidate", false] }, "$candidate", "$author"],
        },
      },
    },
    { $match: { candidateRef: { $ne: null } } },
    {
      $group: {
        _id: "$candidateRef",
        postCount: { $sum: 1 },
        latestPostAt: { $max: "$createdAt" },
      },
    },
    {
      $project: {
        candidateId: { $toString: "$_id" },
        postCount: 1,
        latestPostAt: 1,
      },
    },
  ].filter(Boolean);

  const results = await Post.aggregate(pipeline);
  const map = new Map();
  results.forEach((doc) => {
    map.set(doc.candidateId, {
      postCount: doc.postCount || 0,
      latestPostAt: doc.latestPostAt,
    });
  });
  return map;
}

async function aggregateReactionsByCandidate(electionId) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pipeline = [
    {
      $lookup: {
        from: "posts",
        localField: "post",
        foreignField: "_id",
        as: "postDoc",
      },
    },
    { $unwind: "$postDoc" },
    {
      $addFields: {
        candidateRef: {
          $cond: [
            { $ifNull: ["$postDoc.candidate", false] },
            "$postDoc.candidate",
            "$postDoc.author",
          ],
        },
      },
    },
    { $match: { candidateRef: { $ne: null } } },
    ...buildLookupElectionMatch(electionId, "postDoc.election"),
    {
      $group: {
        _id: "$candidateRef",
        likes: { $sum: { $cond: [{ $eq: ["$type", "like"] }, 1, 0] } },
        loves: { $sum: { $cond: [{ $eq: ["$type", "love"] }, 1, 0] } },
        haha: { $sum: { $cond: [{ $eq: ["$type", "haha"] }, 1, 0] } },
        wow: { $sum: { $cond: [{ $eq: ["$type", "wow"] }, 1, 0] } },
        sad: { $sum: { $cond: [{ $eq: ["$type", "sad"] }, 1, 0] } },
        angry: { $sum: { $cond: [{ $eq: ["$type", "angry"] }, 1, 0] } },
        total: { $sum: 1 },
        uniqueReactionUsers: {
          $addToSet: { $toString: "$user" },
        },
        last24Reactions: {
          $sum: { $cond: [{ $gte: ["$createdAt", cutoff] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        candidateId: { $toString: "$_id" },
        likes: 1,
        loves: 1,
        haha: 1,
        wow: 1,
        sad: 1,
        angry: 1,
        totalReactions: "$total",
        uniqueReactionUsers: 1,
        last24Reactions: "$last24Reactions",
      },
    },
  ];

  const results = await Reaction.aggregate(pipeline);
  const map = new Map();
  results.forEach((doc) => {
    map.set(doc.candidateId, {
      likes: doc.likes || 0,
      loves: doc.loves || 0,
      haha: doc.haha || 0,
      wow: doc.wow || 0,
      sad: doc.sad || 0,
      angry: doc.angry || 0,
      totalReactions: doc.totalReactions || 0,
      uniqueReactionUsers: new Set(doc.uniqueReactionUsers || []),
      last24Reactions: doc.last24Reactions || 0,
    });
  });
  return map;
}

async function aggregateCommentsByCandidate(electionId) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pipeline = [
    {
      $lookup: {
        from: "posts",
        localField: "post",
        foreignField: "_id",
        as: "postDoc",
      },
    },
    { $unwind: "$postDoc" },
    {
      $addFields: {
        candidateRef: {
          $cond: [
            { $ifNull: ["$postDoc.candidate", false] },
            "$postDoc.candidate",
            "$postDoc.author",
          ],
        },
      },
    },
    { $match: { candidateRef: { $ne: null } } },
    ...buildLookupElectionMatch(electionId, "postDoc.election"),
    {
      $group: {
        _id: "$candidateRef",
        comments_count: { $sum: 1 },
        uniqueCommentUsers: {
          $addToSet: { $toString: "$user" },
        },
        last24Comments: {
          $sum: { $cond: [{ $gte: ["$createdAt", cutoff] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        candidateId: { $toString: "$_id" },
        comments_count: 1,
        uniqueCommentUsers: 1,
        last24Comments: 1,
      },
    },
  ];

  const results = await Comment.aggregate(pipeline);
  const map = new Map();
  results.forEach((doc) => {
    map.set(doc.candidateId, {
      comments_count: doc.comments_count || 0,
      uniqueCommentUsers: new Set(doc.uniqueCommentUsers || []),
      last24Comments: doc.last24Comments || 0,
    });
  });
  return map;
}

function ensureCandidateMetrics(map, candidateId) {
  if (!map.has(candidateId)) {
    map.set(candidateId, {
      likes: 0,
      hearts: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
      totalReactions: 0,
      comments_count: 0,
      postCount: 0,
      uniqueReactionUsers: new Set(),
      uniqueCommentUsers: new Set(),
      last24Reactions: 0,
      last24Comments: 0,
      latestPostAt: null,
    });
  }
  return map.get(candidateId);
}

function computeEngagementScore(metrics, uniqueUsers) {
  const positiveReactions = metrics.likes + metrics.hearts + metrics.haha + metrics.wow;
  const negativeReactions = metrics.sad + metrics.angry;
  return (
    positiveReactions * 1.2 +
    metrics.comments_count * 1.4 +
    uniqueUsers * 1.1 +
    metrics.postCount * 0.4 +
    metrics.last24Reactions * 1.6 +
    metrics.last24Comments * 1.2 -
    negativeReactions * 0.3
  );
}

async function hydrateCandidateMetadata(candidateIds) {
  const validIds = candidateIds
    .map((id) => ({ raw: id, oid: asObjectId(id) }))
    .filter((v) => v.oid);

  if (!validIds.length) return new Map();

  const docs = await Candidate.find({ _id: { $in: validIds.map((v) => v.oid) } })
    .select("fullName partyName party photo politicalSign")
    .lean();

  const map = new Map();
  docs.forEach((doc) => {
    map.set(doc._id.toString(), doc);
  });
  return map;
}

function buildAiPayload(candidates) {
  return candidates.map((candidate) => ({
    candidate_id: candidate.id,
    name: candidate.name,
    likes: candidate.metrics.likes,
    hearts: candidate.metrics.hearts,
    thumbs_up: candidate.metrics.haha + candidate.metrics.wow,
    thumbs_down: candidate.metrics.sad + candidate.metrics.angry,
    support: candidate.metrics.hearts,
    shares: 0,
    comments_count: candidate.metrics.comments_count,
    avg_sentiment: 0,
    unique_users: candidate.uniqueUsersCount,
    last24_reaction_delta: candidate.metrics.last24Reactions + candidate.metrics.last24Comments,
  }));
}

function computeHeuristicPrediction(aiPayload, engagementScores) {
  const rows = aiPayload.map((row) => {
    const score =
      row.likes * 0.25 +
      row.hearts * 0.35 +
      row.thumbs_up * 0.3 +
      row.support * 0.4 +
      row.comments_count * 0.45 +
      row.unique_users * 0.3 +
      row.last24_reaction_delta * 0.5 -
      row.thumbs_down * 0.15;
    return {
      candidate_id: row.candidate_id,
      raw: Math.max(score, 0) + (engagementScores.get(row.candidate_id) || 0),
    };
  });

  const total = rows.reduce((acc, row) => acc + row.raw, 0) || 1;
  return rows.map((row) => ({
    candidate_id: row.candidate_id,
    predicted_pct: (row.raw / total) * 100,
  }));
}

async function callAiModel(electionId, aiPayload, engagementScores) {
  const url = `${AI_BASE_URL.replace(/\/$/, "")}/predict`;
  try {
    const { data } = await axios.post(
      url,
      {
        election_id: electionId,
        candidates: aiPayload,
      },
      { timeout: AI_TIMEOUT_MS }
    );
    if (Array.isArray(data?.predictions) && data.predictions.length) {
      return data.predictions;
    }
  } catch (err) {
    console.warn("AI model call failed, using heuristic:", err.message);
  }
  return computeHeuristicPrediction(aiPayload, engagementScores);
}

async function buildElectionPrediction({ electionId }) {
  const resolvedElectionId = await resolveElectionId(electionId);

  const [postsMap, reactionsMap, commentsMap] = await Promise.all([
    aggregatePostsByCandidate(resolvedElectionId),
    aggregateReactionsByCandidate(resolvedElectionId),
    aggregateCommentsByCandidate(resolvedElectionId),
  ]);

  const candidateIds = new Set([
    ...postsMap.keys(),
    ...reactionsMap.keys(),
    ...commentsMap.keys(),
  ]);

  if (!candidateIds.size) {
    return { candidates: [], topCandidateId: null };
  }

  const metricsMap = new Map();
  candidateIds.forEach((candidateId) => {
    const entry = ensureCandidateMetrics(metricsMap, candidateId);
    const postMetrics = postsMap.get(candidateId);
    if (postMetrics) {
      entry.postCount = postMetrics.postCount || 0;
      entry.latestPostAt = postMetrics.latestPostAt || entry.latestPostAt;
    }
    const reactionMetrics = reactionsMap.get(candidateId);
    if (reactionMetrics) {
      entry.likes = reactionMetrics.likes;
      entry.hearts = reactionMetrics.loves;
      entry.haha = reactionMetrics.haha;
      entry.wow = reactionMetrics.wow;
      entry.sad = reactionMetrics.sad;
      entry.angry = reactionMetrics.angry;
      entry.totalReactions = reactionMetrics.totalReactions;
      entry.uniqueReactionUsers = reactionMetrics.uniqueReactionUsers;
      entry.last24Reactions = reactionMetrics.last24Reactions;
    }
    const commentMetrics = commentsMap.get(candidateId);
    if (commentMetrics) {
      entry.comments_count = commentMetrics.comments_count;
      entry.uniqueCommentUsers = commentMetrics.uniqueCommentUsers;
      entry.last24Comments = commentMetrics.last24Comments;
    }
  });

  const metaMap = await hydrateCandidateMetadata([...candidateIds]);

  const candidateSummaries = [];
  const engagementScores = new Map();

  metricsMap.forEach((metrics, candidateId) => {
    const uniqueUsers = new Set([
      ...metrics.uniqueReactionUsers,
      ...metrics.uniqueCommentUsers,
    ]);

    const meta = metaMap.get(candidateId) || {};
    const summary = {
      id: candidateId,
      name: meta.fullName || meta.name || "Candidate",
      party: meta.partyName || meta.party || "Independent",
      metrics,
      uniqueUsersCount: uniqueUsers.size,
    };

    const engagementScore = computeEngagementScore(metrics, uniqueUsers.size);
    engagementScores.set(candidateId, engagementScore);
    candidateSummaries.push(summary);
  });

  const aiPayload = buildAiPayload(candidateSummaries);
  const aiPredictions = await callAiModel(resolvedElectionId, aiPayload, engagementScores);
  const predictionMap = new Map(
    aiPredictions.map((p) => [String(p.candidate_id), Number(p.predicted_pct) || 0])
  );

  const finalCandidates = candidateSummaries.map((candidate) => {
    const pct = predictionMap.get(candidate.id) ?? 0;
    return {
      id: candidate.id,
      name: candidate.name,
      party: candidate.party,
      percentage: Number(pct.toFixed(2)),
    };
  });

  finalCandidates.sort((a, b) => b.percentage - a.percentage);
  return {
    candidates: finalCandidates,
    topCandidateId: finalCandidates[0]?.id || null,
  };
}

module.exports = {
  buildElectionPrediction,
};

