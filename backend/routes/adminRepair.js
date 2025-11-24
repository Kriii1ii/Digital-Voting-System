const express = require('express');
const { protect, committeeOrAdmin } = require('../middleware/authMiddleware');
const { repairOrphanCandidates } = require('../controllers/adminRepairController');

const router = express.Router();

router.post('/repair/orphan-candidates', protect, committeeOrAdmin, repairOrphanCandidates);

module.exports = router;
