const express = require('express');
const { getPrediction, predictPublic } = require('../controllers/predictionController.js');
const { protect, adminOnly } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Admin endpoint (protected) - can be used by admin UI to request model-based prediction
router.get('/:electionId', protect, adminOnly, getPrediction);

// Public polling endpoint used by frontend LivePoll component
router.get('/public/:electionId', predictPublic);

module.exports = router;
