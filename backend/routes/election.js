const express = require('express');
const {
  createElection,
  getElections,
  getElectionById,
  endElection,
} = require('../controllers/electionController.js');
const { protect, adminOnly } = require('../middleware/authMiddleware.js');
const { roleMiddleware } = require('../middleware/roleMiddleware.js');

const router = express.Router();

// --- Election Routes ---

// Create new election — requires protection and 'admin' role
router.post("/create", protect, roleMiddleware(["admin", "committee"]), createElection);

// Get all elections — public access
router.get("/", getElections);

// Get one election by ID — public access
router.get("/:id", getElectionById);

// End an election — requires protection and 'admin' role
router.put("/:id/end", protect, roleMiddleware(["admin", "committee"]), endElection);

// Export the router for use in server.js or main app file
module.exports = router;