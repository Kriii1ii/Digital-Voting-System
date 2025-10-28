// backend/controllers/resultsController.js
import mongoose from 'mongoose';
import Vote from '../models/Vote.js';
import Candidate from '../models/candidate.js'; // keep this path/casing as in your project
import Election from '../models/Election.js';

// 🟢 Get real-time leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { electionId } = req.params;
    if (!mongoose.isValidObjectId(electionId)) {
      return res.status(400).json({ success: false, message: 'Invalid electionId' });
    }
    const eid = new mongoose.Types.ObjectId(electionId);

    const leaderboard = await Vote.aggregate([
      { $match: { election: eid } },
      { $group: { _id: '$candidate', totalVotes: { $sum: 1 } } },
      {
        $lookup: {
          from: 'candidates',           // collection name
          localField: '_id',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: '$candidate' },
      {
        $project: {
          _id: 0,
          candidateId: '$candidate._id',
          name: '$candidate.name',
          party: '$candidate.party',
          totalVotes: 1
        }
      },
      { $sort: { totalVotes: -1 } }
    ]);

    return res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    console.error('getLeaderboard error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// 🏆 Get final results
export const getResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    if (!mongoose.isValidObjectId(electionId)) {
      return res.status(400).json({ success: false, message: 'Invalid electionId' });
    }
    const eid = new mongoose.Types.ObjectId(electionId);

    const election = await Election.findById(eid);
    if (!election || !election.isCompleted) {
      return res.status(400).json({ success: false, message: 'Election not completed yet' });
    }

    const results = await Vote.aggregate([
      { $match: { election: eid } },
      { $group: { _id: '$candidate', totalVotes: { $sum: 1 } } },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: '$candidate' },
      {
        $project: {
          _id: 0,
          candidateId: '$candidate._id',
          name: '$candidate.name',
          party: '$candidate.party',
          totalVotes: 1
        }
      },
      { $sort: { totalVotes: -1 } }
    ]);

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('getResults error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// optional default export if you ever import as a single object
export default { getLeaderboard, getResults };
