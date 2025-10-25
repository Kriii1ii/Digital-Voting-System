import { io } from "../server.js";
import Vote from '../models/Vote.js';
import Election from '../models/Election.js';
import mongoose from "mongoose";
// import Candidate from '../models/Candidate.js';

// Cast a vote
export const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    const voterId = req.user._id;

    // Check if election exists
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: "Election not found" });

    // Check if voter already voted
    const existingVote = await Vote.findOne({ voter: voterId, election: electionId });
    if (existingVote) return res.status(400).json({ message: "You already voted" });

    // Save the vote
    const vote = await Vote.create({
      voter: voterId,
      candidate: candidateId,
      election: electionId
    });

    // Get updated leaderboard
    const electionObjectId = new mongoose.Types.ObjectId(electionId);
    const leaderboard = await Vote.aggregate([
      { $match: { election: electionObjectId } },
      { $group: { _id: "$candidate", votes: { $sum: 1 } } },
      { $sort: { votes: -1 } },
      { $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "candidateDetails"
      } },
      { $unwind: "$candidateDetails" },
      { $project: { _id: 0, candidate: "$candidateDetails.name", votes: 1 } }
    ]);

    // Broadcast to all clients in that election room
    io.to(electionId).emit("leaderboardUpdate", leaderboard);

    res.status(201).json({ success: true, message: "Vote cast successfully", vote });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get election leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { electionId } = req.params;

    const results = await Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: "$candidate", votes: { $sum: 1 } } },
      { $sort: { votes: -1 } },
      { $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "candidateDetails"
      } },
      { $unwind: "$candidateDetails" },
      { $project: { _id: 0, candidate: "$candidateDetails.name", votes: 1 } }
    ]);

    res.status(200).json({ success: true, leaderboard: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
