const express = require("express");
const { getAdminStats, getAdminWinners, getVotesByElection } = require("../controllers/adminController.js");
const { protect, adminOnly } = require("../middleware/authMiddleware.js");

const router = express.Router();

/**
 * ADMIN ROUTES (public to match endpoints.js usage)
 * Base path: /api/admin
 */

// Dashboard stats
router.get("/stats", protect, adminOnly, getAdminStats); 

// Winning candidates (optionally pass ?electionId=...)
router.get("/winners", protect, adminOnly, getAdminWinners); 

// Detailed votes per election (admin-only)
router.get('/votes/:electionId', protect, adminOnly, getVotesByElection);

module.exports = router;
