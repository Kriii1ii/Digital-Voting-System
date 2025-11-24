const express = require('express');
const { getPrediction } = require('../controllers/predictionController.js');
const { protect } = require('../middleware/authMiddleware.js');
const router = express.Router();

// GET /api/predictions/election/:electionId
// Protected: user must be authenticated; controller will return 204 for candidate role
router.get('/election/:electionId', protect, getPrediction);


module.exports = router;





