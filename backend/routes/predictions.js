const express = require("express");
const { getElectionPredictionPoll } = require("../controllers/predictionPollController.js");
const { protect } = require("../middleware/authMiddleware.js");
const { roleMiddleware } = require("../middleware/roleMiddleware.js");

const router = express.Router();

router.get(
  "/election",
  protect,
  roleMiddleware(["voter", "admin"]),
  getElectionPredictionPoll
);

module.exports = router;





