// backend/controllers/voteController.js
import mongoose from 'mongoose';
import { io } from '../server.js';
import Vote from '../models/Vote.js';
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js'; // ✅ fix case

// Build a rich tally with zero-vote candidates too
async function computeTally(electionId) {
  const [agg, candidates, election] = await Promise.all([
    Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$candidate', votes: { $sum: 1 } } },
    ]),
    Candidate.find({ election: electionId }).select('_id name party').lean(),
    Election.findById(electionId).lean(),
  ]);

  const totalVotes = agg.reduce((s, r) => s + r.votes, 0);
  const byId = Object.fromEntries(agg.map(a => [String(a._id), a.votes]));

  const leaderboard = candidates
    .map(c => {
      const v = byId[String(c._id)] || 0;
      return {
        candidateId: c._id,
        name: c.name,
        party: c.party,
        votes: v,
        percent: totalVotes ? (v / totalVotes) * 100 : 0,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  return {
    electionId,
    status: election?.status,
    totalVotes,
    leaderboard,
  };
}

// Cast a vote (only for verified users; enforce one vote per election)
export const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    const userId = req.user._id;
    const voterIdStr = req.user.voterId || req.user.voterid; // alias-safe

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(electionId) ||
      !mongoose.Types.ObjectId.isValid(candidateId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid election or candidate ID' });
    }

    // Ensure election exists and is open
    const election = await Election.findById(electionId);
    if (!election)
      return res.status(404).json({ success: false, message: 'Election not found' });

    const now = new Date();
    if (election.startsAt && now < new Date(election.startsAt)) {
      return res.status(400).json({ success: false, message: 'Voting has not started' });
    }
    if (election.endsAt && now > new Date(election.endsAt)) {
      return res.status(400).json({ success: false, message: 'Voting period has ended' });
    }
    if (election.status && !['ongoing', 'open'].includes(election.status)) {
      return res.status(400).json({ success: false, message: 'Election is not open for voting' });
    }

    // Optional eligibility filter (if present)
    if (Array.isArray(election.eligibleVoterIds) && election.eligibleVoterIds.length > 0) {
      if (!election.eligibleVoterIds.includes(voterIdStr)) {
        return res
          .status(403)
          .json({ success: false, message: 'You are not eligible to vote in this election' });
      }
    }

    // Validate candidate belongs to this election
    const candidate = await Candidate.findOne({ _id: candidateId, election: electionId });
    if (!candidate) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid candidate for this election' });
    }

    // Prevent duplicate vote
    const existingVote = await Vote.findOne({ voter: userId, election: electionId });
    if (existingVote) {
      return res.status(400).json({ success: false, message: 'You have already voted' });
    }

    // Store the vote
    await Vote.create({
      voter: userId,
      candidate: candidateId,
      election: electionId,
      castAt: new Date(),
      // blockchainTxHash: '...' // add when you wire blockchain
    });

    // Recompute tally & broadcast
    const tally = await computeTally(electionId);
    const room = String(electionId);
    io.to(room).emit('leaderboard:update', tally);     // namespaced event
    io.to(room).emit('leaderboardUpdate', tally);      // backward compatibility

    return res
      .status(201)
      .json({ success: true, message: 'Vote cast successfully', data: tally });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Public leaderboard for an election (logged-in users)
export const getLeaderboard = async (req, res) => {
  try {
    const { electionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(electionId)) {
      return res.status(400).json({ success: false, message: 'Invalid election ID' });
    }

    const tally = await computeTally(electionId);
    return res.status(200).json({ success: true, data: tally });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
