import express from "express";
import { castVote, getLeaderboard } from "../controllers/voteController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Cast a vote — only logged-in users
router.post("/cast", protect, castVote);

// Get election leaderboard — public
router.get("/leaderboard/:electionId", getLeaderboard);

export default router;
