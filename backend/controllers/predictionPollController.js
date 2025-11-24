const { buildElectionPrediction } = require("../services/predictionPollService.js");

async function getElectionPredictionPoll(req, res) {
  try {
    const { electionId } = req.query;
    const payload = await buildElectionPrediction({ electionId });

    if (!payload.candidates.length) {
      return res
        .status(404)
        .json({ message: "No engagement metrics are available for the requested election." });
    }

    return res.json(payload);
  } catch (error) {
    console.error("Election prediction poll error:", error);
    return res.status(500).json({
      message: "Unable to build election prediction poll.",
      error: error.message || error,
    });
  }
}

module.exports = {
  getElectionPredictionPoll,
};





