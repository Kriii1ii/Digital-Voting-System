const express = require("express");
const {
  castVote,
  getLeaderboard,
} = require("../controllers/voteController.js");
const { protect, requireVerified, adminOnly } = require("../middleware/authMiddleware.js");
const Vote = require("../models/Vote.js");

const router = express.Router();

/**
 * VOTE ROUTES
 * Base path: /api/votes
 */

// 🗳 Get all votes (admin only)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate("voter", "fullName email role")
      .populate("candidate", "fullName party role")
      .populate("election", "title status")
      .lean();

    res.status(200).json(votes);
  } catch (error) {
    console.error("Error fetching votes:", error);
    res.status(500).json({ message: "Failed to fetch votes" });
  }
});

// 🗳 Cast a vote — logged-in users (no extra verification required)
router.post("/cast", protect, castVote);

// 📊 Get election leaderboard — public
router.get("/leaderboard/:electionId", getLeaderboard);

module.exports = router;
