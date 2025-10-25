import express from "express";
import { castVote, getLeaderboard } from "../controllers/voteController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Cast vote — only logged-in users
router.post("/cast", authMiddleware, castVote);

// Get leaderboard — public
router.get("/leaderboard/:electionId", getLeaderboard);

export default router;
