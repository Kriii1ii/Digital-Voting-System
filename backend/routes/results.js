import express from 'express';
import { protect, committeeOrAdmin } from '../middleware/authMiddleware.js';
import { getLeaderboard, getResults, publishResults } from '../controllers/resultsController.js';

const router = express.Router();

// live leaderboard (any logged-in user)
router.get('/leaderboard/:electionId', protect, getLeaderboard);

// final results (completed elections)
router.get('/final/:electionId', protect, getResults);

// publish & lock results (committee/admin)
router.post('/publish', protect, committeeOrAdmin, publishResults);

export default router;
