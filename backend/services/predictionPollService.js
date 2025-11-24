const axios = require("axios");
const mongoose = require("mongoose");

const Candidate = require("../models/Candidate.js");
const Post = require("../models/Post.js");
const Reaction = require("../models/Reaction.js");
const PollVote = require("../models/PollVote.js");
const PollInteraction = require("../models/PollInteraction.js");
const Election = require("../models/Election.js");

const { ObjectId } = mongoose.Types;

const AI_BASE_URL = process.env.AI_PREDICTION_URL || "http://localhost:8000";
const AI_TIMEOUT_MS = Number(process.env.AI_PREDICTION_TIMEOUT_MS || 8000);

function asObjectId(id) {
  if (!id) return null;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function buildElectionMatch(electionId, stringField, objectField) {
  if (!electionId) return {};
  const clauses = [];
  clauses.push({ [stringField]: electionId });
  const objectId = asObjectId(electionId);
  if (objectId) {
    clauses.push({ [objectField]: objectId });
  }
  return clauses.length ? { $or: clauses } : {};
}

function normalizeCandidateId(candidateId, fallback) {
  if (candidateId) return candidateId;
  if (!fallback) return null;
  return typeof fallback === "string" ? fallback : fallback.toString();
}

async function resolveElectionId(explicitElectionId) {
  if (explicitElectionId) return explicitElectionId;

  const active = await Election.findOne({ isActive: true }).sort({ startDate: -1 }).lean();
  if (active?._id) return active._id.toString();

  const fallback = await Election.findOne().sort({ createdAt: -1 }).lean();
  return fallback?._id ? fallback._id.toString() : null;
}

async function aggregatePostsByCandidate(electionId) {
  const match = buildElectionMatch(electionId, "election_id", "election");
  const pipeline = [
    Object.keys(match).length ? { $match: match } : null,
    {
      $addFields: {
        candidateRef: {
          $ifNull: ["$candidate", "$author"],
        },
        candidateId: {
          $ifNull: ["$candidate_id", { $toString: { $ifNull: ["$candidate", "$author"] } }],
        },
      },
    },
    { $match: { candidateId: { $ne: null } } },
    {
      $group: {
        _id: "$candidateId",
        postCount: { $sum: 1 },
        latestPostAt: { $max: "$createdAt" },
      },
    },
    {
      $project: {
        candidateId: "$_id",
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
  const match = buildElectionMatch(electionId, "election_id", "election");
  const pipeline = [
    Object.keys(match).length ? { $match: match } : null,
    {
      $addFields: {
        candidateId: {
          $ifNull: ["$candidate_id", { $toString: "$candidate" }],
        },
      },
    },
    { $match: { candidateId: { $ne: null } } },
    {
      $group: {
        _id: "$candidateId",
        likes: { $sum: { $cond: [{ $eq: ["$type", "like"] }, 1, 0] } },
        wow: { $sum: { $cond: [{ $eq: ["$type", "wow"] }, 1, 0] } },
        angry: { $sum: { $cond: [{ $eq: ["$type", "angry"] }, 1, 0] } },
        love: { $sum: { $cond: [{ $eq: ["$type", "love"] }, 1, 0] } },
        haha: { $sum: { $cond: [{ $eq: ["$type", "haha"] }, 1, 0] } },
        sad: { $sum: { $cond: [{ $eq: ["$type", "sad"] }, 1, 0] } },
        support: { $sum: { $cond: [{ $eq: ["$type", "support"] }, 1, 0] } },
        care: { $sum: { $cond: [{ $eq: ["$type", "care"] }, 1, 0] } },
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
        candidateId: "$_id",
        likes: 1,
        wow: 1,
        angry: 1,
        love: 1,
        haha: 1,
        sad: 1,
        support: 1,
        care: 1,
        totalReactions: "$total",
        uniqueReactionUsers: 1,
        last24Reactions: 1,
      },
    },
  ].filter(Boolean);

  const results = await Reaction.aggregate(pipeline);
  const map = new Map();
  results.forEach((doc) => {
    map.set(doc.candidateId, {
      likes: doc.likes || 0,
      wow: doc.wow || 0,
      angry: doc.angry || 0,
      love: doc.love || 0,
      haha: doc.haha || 0,
      sad: doc.sad || 0,
      support: doc.support || 0,
      care: doc.care || 0,
      totalReactions: doc.totalReactions || 0,
      uniqueReactionUsers: new Set(doc.uniqueReactionUsers || []),
      last24Reactions: doc.last24Reactions || 0,
    });
  });
  return map;
}

async function aggregatePollInteractionsByCandidate(electionId) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const match = buildElectionMatch(electionId, "election_id", "election");
  const pipeline = [
    Object.keys(match).length ? { $match: match } : null,
    {
      $addFields: {
        candidateId: {
          $ifNull: ["$candidate_id", { $toString: "$candidate" }],
        },
      },
    },
    { $match: { candidateId: { $ne: null } } },
    {
      $group: {
        _id: "$candidateId",
        likes: { $sum: { $cond: [{ $eq: ["$type", "like"] }, 1, 0] } },
        wow: { $sum: { $cond: [{ $eq: ["$type", "wow"] }, 1, 0] } },
        angry: { $sum: { $cond: [{ $eq: ["$type", "angry"] }, 1, 0] } },
        love: { $sum: { $cond: [{ $eq: ["$type", "love"] }, 1, 0] } },
        haha: { $sum: { $cond: [{ $eq: ["$type", "haha"] }, 1, 0] } },
        sad: { $sum: { $cond: [{ $eq: ["$type", "sad"] }, 1, 0] } },
        support: { $sum: { $cond: [{ $eq: ["$type", "support"] }, 1, 0] } },
        care: { $sum: { $cond: [{ $eq: ["$type", "care"] }, 1, 0] } },
        goodComments: { $sum: { $cond: [{ $eq: ["$type", "good_comment"] }, 1, 0] } },
        badComments: { $sum: { $cond: [{ $eq: ["$type", "bad_comment"] }, 1, 0] } },
        shares: { $sum: { $cond: [{ $eq: ["$type", "share"] }, 1, 0] } },
        uniqueInteractionUsers: {
          $addToSet: { $toString: "$user" },
        },
        last24Interactions: {
          $sum: { $cond: [{ $gte: ["$createdAt", cutoff] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        candidateId: "$_id",
        likes: 1,
        wow: 1,
        angry: 1,
        love: 1,
        haha: 1,
        sad: 1,
        support: 1,
        care: 1,
        goodComments: "$goodComments",
        badComments: "$badComments",
        shares: "$shares",
        uniqueInteractionUsers: 1,
        last24Interactions: 1,
      },
    },
  ].filter(Boolean);

  const results = await PollInteraction.aggregate(pipeline);
  const map = new Map();
  results.forEach((doc) => {
    map.set(doc.candidateId, {
      likes: doc.likes || 0,
      wow: doc.wow || 0,
      angry: doc.angry || 0,
      love: doc.love || 0,
      haha: doc.haha || 0,
      sad: doc.sad || 0,
      support: doc.support || 0,
      care: doc.care || 0,
      goodComments: doc.goodComments || 0,
      badComments: doc.badComments || 0,
      shares: doc.shares || 0,
      uniqueInteractionUsers: new Set(doc.uniqueInteractionUsers || []),
      last24Interactions: doc.last24Interactions || 0,
    });
  });
  return map;
}

async function aggregatePollVotesByCandidate(electionId) {
  const match = buildElectionMatch(electionId, "election_id", "election");
  const pipeline = [
    Object.keys(match).length ? { $match: match } : null,
    {
      $addFields: {
        candidateId: {
          $ifNull: ["$candidate_id", { $toString: "$candidate" }],
        },
      },
    },
    { $match: { candidateId: { $ne: null } } },
    {
      $group: {
        _id: "$candidateId",
        votes: { $sum: 1 },
      },
    },
    {
      $project: {
        candidateId: "$_id",
        votes: 1,
      },
    },
  ].filter(Boolean);

  const results = await PollVote.aggregate(pipeline);
  const map = new Map();
  results.forEach((doc) => {
    if (!doc.candidateId) return;
    map.set(doc.candidateId, { votes: doc.votes || 0 });
  });
  return map;
}

function ensureCandidateMetrics(map, candidateId) {
  if (!map.has(candidateId)) {
    map.set(candidateId, {
      likes: 0,
      wow: 0,
      angry: 0,
      love: 0,
      haha: 0,
      sad: 0,
      support: 0,
      care: 0,
      shares: 0,
      goodComments: 0,
      badComments: 0,
      postCount: 0,
      latestPostAt: null,
      totalReactions: 0,
      last24Reactions: 0,
      last24Interactions: 0,
      uniqueReactionUsers: new Set(),
      uniqueInteractionUsers: new Set(),
      totalVotes: 0,
    });
  }
  return map.get(candidateId);
}

function computeEngagementScore(metrics, uniqueUsers) {
  const positiveReactions = metrics.likes + metrics.wow + metrics.love + metrics.haha + metrics.support + metrics.care;
  const negativeReactions = metrics.angry + metrics.sad;
  const commentSignal = metrics.goodComments - metrics.badComments;
  return (
    positiveReactions * 1.1 +
    metrics.shares * 0.4 +
    metrics.postCount * 0.5 +
    uniqueUsers * 1.2 +
    metrics.last24Reactions * 1.4 +
    metrics.last24Interactions * 1.1 +
    metrics.totalVotes * 0.8 +
    commentSignal * 0.6 -
    negativeReactions * 0.4
  );
}

async function hydrateCandidateMetadata(candidateIds) {
  const validIds = candidateIds
    .map((id) => ({ raw: id, oid: asObjectId(id) }))
    .filter((v) => v.oid);

  if (!validIds.length) return new Map();

  const docs = await Candidate.find({ _id: { $in: validIds.map((v) => v.oid) } })
    .select("fullName partyName party photo politicalSign election election_id")
    .lean();

  const map = new Map();
  docs.forEach((doc) => {
    map.set(doc._id.toString(), doc);
  });
  return map;
}

function buildAiPayload(candidates) {
  return candidates.map((candidate) => {
    const metrics = candidate.metrics;
    const totalComments = metrics.goodComments + metrics.badComments;
    const avgSentiment =
      totalComments > 0 ? (metrics.goodComments - metrics.badComments) / totalComments : 0;
    return {
      candidate_id: candidate.id,
      name: candidate.name,
      likes: metrics.likes + metrics.love + metrics.support + metrics.care,
      hearts: metrics.love + metrics.support,
      thumbs_up: metrics.likes + metrics.wow + metrics.haha,
      thumbs_down: metrics.angry + metrics.sad,
      support: metrics.support + metrics.care,
      shares: metrics.shares,
      comments_count: totalComments,
      avg_sentiment: Number(avgSentiment.toFixed(2)),
      unique_users: candidate.uniqueUsersCount,
      last24_reaction_delta: metrics.last24Reactions + metrics.last24Interactions,
    };
  });
}

function computeHeuristicPrediction(aiPayload, engagementScores) {
  if (!aiPayload.length) return [];

  const rows = aiPayload.map((row) => {
    const score =
      row.likes * 0.25 +
      row.hearts * 0.35 +
      row.thumbs_up * 0.3 +
      row.support * 0.4 +
      row.comments_count * 0.45 +
      row.unique_users * 0.3 +
      row.last24_reaction_delta * 0.5 -
      row.thumbs_down * 0.2 +
      row.avg_sentiment * 10;
    return {
      candidate_id: row.candidate_id,
      raw: Math.max(score, 0) + (engagementScores.get(row.candidate_id) || 0),
    };
  });

  const total = rows.reduce((acc, row) => acc + row.raw, 0);
  if (!total) {
    const evenSplit = rows.length ? 100 / rows.length : 0;
    return rows.map((row) => ({
      candidate_id: row.candidate_id,
      predicted_pct: evenSplit,
    }));
  }

  return rows.map((row) => ({
    candidate_id: row.candidate_id,
    predicted_pct: (row.raw / total) * 100,
  }));
}

async function callAiModel(electionId, aiPayload, engagementScores) {
  if (!aiPayload.length) return [];
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

async function fetchCandidateIdsForElection(electionId) {
  if (!electionId) return [];
  const match = buildElectionMatch(electionId, "election_id", "election");
  if (!Object.keys(match).length) return [];
  const docs = await Candidate.find(match).select("_id").lean();
  return docs.map((doc) => doc._id.toString());
}

async function buildElectionPrediction({ electionId }) {
  const resolvedElectionId = await resolveElectionId(electionId);
  if (!resolvedElectionId) {
    return { candidates: [], topCandidateId: null, message: "No election found" };
  }

  const [postsMap, reactionsMap, interactionsMap, votesMap, candidateDocIds] = await Promise.all([
    aggregatePostsByCandidate(resolvedElectionId),
    aggregateReactionsByCandidate(resolvedElectionId),
    aggregatePollInteractionsByCandidate(resolvedElectionId),
    aggregatePollVotesByCandidate(resolvedElectionId),
    fetchCandidateIdsForElection(resolvedElectionId),
  ]);

  const candidateIds = new Set([
    ...candidateDocIds,
    ...postsMap.keys(),
    ...reactionsMap.keys(),
    ...interactionsMap.keys(),
    ...votesMap.keys(),
  ]);

  if (!candidateIds.size) {
    return {
      candidates: [],
      topCandidateId: null,
      message: "No candidates or engagement metrics available for this election",
    };
  }

  const metricsMap = new Map();
  candidateIds.forEach((candidateId) => {
    const entry = ensureCandidateMetrics(metricsMap, candidateId);

    const postMetrics = postsMap.get(candidateId);
    if (postMetrics) {
      entry.postCount = postMetrics.postCount || 0;
      entry.latestPostAt = postMetrics.latestPostAt || entry.latestPostAt;
    }

    const interactionMetrics = interactionsMap.get(candidateId);
    if (interactionMetrics) {
      entry.likes += interactionMetrics.likes;
      entry.wow += interactionMetrics.wow;
      entry.angry += interactionMetrics.angry;
      entry.love += interactionMetrics.love;
      entry.haha += interactionMetrics.haha;
      entry.sad += interactionMetrics.sad;
      entry.support += interactionMetrics.support;
      entry.care += interactionMetrics.care;
      entry.goodComments += interactionMetrics.goodComments;
      entry.badComments += interactionMetrics.badComments;
      entry.shares += interactionMetrics.shares;
      interactionMetrics.uniqueInteractionUsers.forEach((u) =>
        entry.uniqueInteractionUsers.add(u)
      );
      entry.last24Interactions += interactionMetrics.last24Interactions;
      const interactionTotal =
        interactionMetrics.likes +
        interactionMetrics.wow +
        interactionMetrics.angry +
        interactionMetrics.love +
        interactionMetrics.haha +
        interactionMetrics.sad +
        interactionMetrics.support +
        interactionMetrics.care;
      entry.totalReactions += interactionTotal;
    }

    const reactionMetrics = reactionsMap.get(candidateId);
    if (reactionMetrics) {
      // Only add reaction-based sentiment if we don't already have poll_interactions
      if (!interactionMetrics) {
        entry.likes += reactionMetrics.likes;
        entry.wow += reactionMetrics.wow;
        entry.angry += reactionMetrics.angry;
        entry.love += reactionMetrics.love;
        entry.haha += reactionMetrics.haha;
        entry.sad += reactionMetrics.sad;
        entry.support += reactionMetrics.support;
        entry.care += reactionMetrics.care;
        entry.totalReactions += reactionMetrics.totalReactions;
      }
      reactionMetrics.uniqueReactionUsers.forEach((u) => entry.uniqueReactionUsers.add(u));
      entry.last24Reactions += reactionMetrics.last24Reactions;
    }

    const voteMetrics = votesMap.get(candidateId);
    if (voteMetrics) {
      entry.totalVotes += voteMetrics.votes || 0;
    }
  });

  const metaMap = await hydrateCandidateMetadata([...candidateIds]);

  const candidateSummaries = [];
  const engagementScores = new Map();

  metricsMap.forEach((metrics, candidateId) => {
    const uniqueUsers = new Set([
      ...metrics.uniqueReactionUsers,
      ...metrics.uniqueInteractionUsers,
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

  if (!candidateSummaries.length) {
    return {
      candidates: [],
      topCandidateId: null,
      message: "No candidate summaries could be generated",
    };
  }

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
    message: finalCandidates.length ? undefined : "No predictions available",
  };
}

module.exports = {
  buildElectionPrediction,
};

