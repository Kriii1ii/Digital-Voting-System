// routes/results.js
import express from 'express';
import { getResults, getLeaderboard } from '../controllers/resultsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get real-time leaderboard
router.get('/leaderboard/:electionId', protect, getLeaderboard);

// Get final results (admin only)
router.get('/final/:electionId', protect, adminOnly, getResults);

export default router;
