// routes/results.js
import express from 'express';
import { getResults, getLeaderboard } from '../controllers/resultsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { protect, committeeOrAdmin } from '../middleware/authMiddleware.js';
import { getResults, publishResults } from '../controllers/resultsController.js';

const router = express.Router();

// Anyone logged in can view results
router.get('/', protect, getResults);

// Only committee/admin can publish or modify results
router.post('/publish', protect, committeeOrAdmin, publishResults);

// Get real-time leaderboard
router.get('/leaderboard/:electionId', protect, getLeaderboard);

// Get final results (admin only)
router.get('/final/:electionId', protect, adminOnly, getResults);

export default router;
