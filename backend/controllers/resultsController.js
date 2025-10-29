// backend/controllers/resultsController.js
import mongoose from 'mongoose';
import Vote from '../models/Vote.js';
import Candidate from '../models/Candidate.js'; // ✅ case-sensitive on Linux/Mac
import Election from '../models/Election.js';

/** Validate ObjectId */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Determine if an election is completed (works with either status or isActive+endDate) */
function isElectionCompleted(election) {
  if (!election) return false;
  if (typeof election.status === 'string') {
    return election.status === 'completed';
  }
  if (typeof election.isCompleted === 'boolean') {
    return election.isCompleted === true;
  }
  // fallback: treat endDate in the past or isActive false as completed
  const now = new Date();
  if (election.endDate && new Date(election.endDate) < now) return true;
  if (typeof election.isActive === 'boolean') return election.isActive === false;
  return false;
}

/** Build a rich leaderboard including zero-vote candidates */
async function buildLeaderboard(electionId) {
  const eid = new mongoose.Types.ObjectId(electionId);

  // Start from candidates (ensures zero-vote candidates appear)
  const rows = await Candidate.aggregate([
    { $match: { election: eid } },
    {
      $lookup: {
        from: 'votes',
        let: { cid: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$candidate', '$$cid'] },
                  { $eq: ['$election', eid] },
                ],
              },
            },
          },
          { $count: 'count' },
        ],
        as: 'voteStats',
      },
    },
    {
      $addFields: {
        totalVotes: {
          $ifNull: [{ $arrayElemAt: ['$voteStats.count', 0] }, 0],
        },
      },
    },
    {
      $project: {
        _id: 0,
        candidateId: '$_id',
        name: 1,
        party: 1,
        totalVotes: 1,
      },
    },
    { $sort: { totalVotes: -1 } },
  ]);

  const totalVotes = rows.reduce((s, r) => s + (r.totalVotes || 0), 0);
  const leaderboard = rows.map((r) => ({
    ...r,
    percent: totalVotes ? (r.totalVotes / totalVotes) * 100 : 0,
  }));

  return { totalVotes, leaderboard };
}

/**
 * GET /api/results/leaderboard/:electionId
 * Live leaderboard (works before or after completion)
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { electionId } = req.params;
    if (!isValidId(electionId)) {
      return res.status(400).json({ success: false, message: 'Invalid electionId' });
    }

    // Optional: verify election exists
    const election = await Election.findById(electionId).lean();
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }

    const { totalVotes, leaderboard } = await buildLeaderboard(electionId);
    return res.status(200).json({
      success: true,
      data: {
        electionId,
        status: election.status,
        totalVotes,
        leaderboard,
      },
    });
  } catch (error) {
    console.error('getLeaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * GET /api/results/final/:electionId
 * Final results — only after election is completed
 */
export const getResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    if (!isValidId(electionId)) {
      return res.status(400).json({ success: false, message: 'Invalid electionId' });
    }

    const election = await Election.findById(electionId).lean();
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found' });
    }
    if (!isElectionCompleted(election)) {
      return res.status(400).json({ success: false, message: 'Election not completed yet' });
    }

    const { totalVotes, leaderboard } = await buildLeaderboard(electionId);
    return res.status(200).json({
      success: true,
      data: {
        electionId,
        status: election.status ?? 'completed',
        publishedAt: election.publishedAt,
        totalVotes,
        leaderboard,
      },
    });
  } catch (error) {
    console.error('getResults error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// optional default export for aggregated import style
export default { getLeaderboard, getResults };
