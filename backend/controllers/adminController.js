const mongoose = require("mongoose");
const User = require("../models/User.js");
const Vote = require("../models/Vote.js");
const Election = require("../models/Election.js");
const Candidate = require("../models/Candidate.js");

/**
 * GET /api/admin/stats
 * Returns: { candidates, totalVoters, voted }
 * - candidates: total candidate count (from Candidate collection; fallback to Users with role=candidate)
 * - totalVoters: total registered voters (Users role='voter')
 * - voted: distinct voters who have cast at least one vote (across any election)
 */
exports.getAdminStats = async (req, res) => {
  try {
    // Count candidates (prefer Candidate model; fallback to User role=candidate)
    let candidates = await Candidate.countDocuments().catch(() => 0);
    if (!candidates || Number.isNaN(candidates)) {
      candidates = await User.countDocuments({ role: "candidate" });
    }

    const totalVoters = await User.countDocuments({ role: "voter" });

    // distinct voters who voted
    const distinct = await Vote.distinct("voter");
    const voted = distinct.length || 0;

    res.json({ candidates, totalVoters, voted });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ message: "Failed to load admin stats" });
  }
};

/**
 * GET /api/admin/winners
 * Optional query: ?electionId=...
 * Returns: top candidates by votes for the chosen election.
 * Fallback election = active election, else most recent by startDate.
 * Shape (array): [{ id, name, votes, party, sign, photo }]
 */
exports.getAdminWinners = async (req, res) => {
  try {
    const { electionId } = req.query;

    // Resolve election to use
    let election = null;
    if (electionId && mongoose.isValidObjectId(electionId)) {
      election = await Election.findById(electionId);
    }
    if (!election) {
      // Prefer an active election
      election = await Election.findOne({ status: "active" }).sort({ startDate: -1 });
    }
    if (!election) {
      // Fallback to the most recent election by startDate
      election = await Election.findOne().sort({ startDate: -1 });
    }
    if (!election) {
      return res.json([]); // nothing yet
    }

    // Aggregate votes for that election by candidate
    const rows = await Vote.aggregate([
      { $match: { election: election._id } },
      { $group: { _id: "$candidate", votes: { $sum: 1 } } },
      {
        $lookup: {
          from: "candidates", // collection name for Candidate model
          localField: "_id",
          foreignField: "_id",
          as: "cand",
        },
      },
      { $unwind: "$cand" },
      {
        $project: {
          id: "$cand._id",
          name: "$cand.fullName",
          party: "$cand.partyName",
          sign: "$cand.signName", // if you store a sign name on candidate
          photo: "$cand.photo",
          votes: 1,
        },
      },
      { $sort: { votes: -1, name: 1 } },
      { $limit: 10 },
    ]);

    res.json(rows);
  } catch (err) {
    console.error("getAdminWinners error:", err);
    res.status(500).json({ message: "Failed to load winners" });
  }
};

/**
 * GET /api/admin/votes/:electionId
 * Admin-only: returns votes grouped by candidate with voter details
 */
exports.getVotesByElection = async (req, res) => {
  try {
    const { electionId } = req.params;
    if (!electionId) return res.status(400).json({ message: 'Missing electionId' });

    // resolve election
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // Aggregate votes with voter details
    const rows = await Vote.aggregate([
      { $match: { election: election._id } },
      {
        $lookup: {
          from: 'users',
          localField: 'voter',
          foreignField: '_id',
          as: 'voterDoc',
        },
      },
      { $unwind: { path: '$voterDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidateDoc',
        },
      },
      { $unwind: { path: '$candidateDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          voter: { id: '$voterDoc._id', fullName: '$voterDoc.fullName', email: '$voterDoc.email', role: '$voterDoc.role' },
          candidate: { id: '$candidateDoc._id', name: '$candidateDoc.fullName', party: '$candidateDoc.partyName' },
          castAt: '$createdAt',
        },
      },
    ]);

    // Group by candidate
    const grouped = {};
    rows.forEach((r) => {
      const candId = r.candidate?.id ? String(r.candidate.id) : 'unknown';
      if (!grouped[candId]) grouped[candId] = { candidate: r.candidate || { id: candId, name: 'Unknown' }, votes: 0, voters: [] };
      grouped[candId].votes += 1;
      grouped[candId].voters.push(r.voter || null);
    });

    // Convert to array
    const result = Object.values(grouped).sort((a, b) => b.votes - a.votes);
    return res.json({ election: { id: election._id, title: election.title }, results: result });
  } catch (err) {
    console.error('getVotesByElection error:', err);
    res.status(500).json({ message: 'Failed to load votes for election' });
  }
};
