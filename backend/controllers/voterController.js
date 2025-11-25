const Voter = require("../models/Voter.js");

// Get all voters
const getAllVoters = async (req, res) => {
  try {
    const { q, registered } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    // Search filter
    if (q) {
      filter.$or = [
        { voterId: new RegExp(q, "i") },
        { fullName: new RegExp(q, "i") }
      ];
    }

    if (registered === "true") filter.hasRegistered = true;
    if (registered === "false") filter.hasRegistered = false;

    // PAGINATED RESULT
    const voters = await Voter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // FIX: Count full totals (NOT paginated)
    const totalVoters = await Voter.countDocuments(filter);
    const totalVerified = await Voter.countDocuments({ ...filter, verified: true });
    const totalPending = await Voter.countDocuments({ ...filter, verified: false });

    return res.json({
      success: true,
      totalVoters,
      totalVerified,
      totalPending,
      totalPages: Math.ceil(totalVoters / limit),
      currentPage: page,
      results: voters
    });
  } catch (err) {
    console.error("Get voters error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Verify voter
const verifyVoter = async (req, res) => {
  try {
    const { voterId } = req.params;
    const formattedId = voterId.toUpperCase().trim();
    const voter = await Voter.findOne({ voterId: formattedId });

    if (!voter) {
      return res.status(404).json({ success: false, message: "Voter not found in registry" });
    }

    if (voter.verified) {
      return res.status(400).json({ success: false, message: "Voter is already verified" });
    }

    voter.verified = true;
    await voter.save();

    return res.json({
      success: true,
      message: "Voter verified successfully",
      data: {
        id: voter._id,
        voterId: voter.voterId,
        verified: voter.verified
      }
    });
  } catch (err) {
    console.error("Verify voter error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update voter
const updateVoter = async (req, res) => {
  try {
    const { id } = req.params;
    const voter = await Voter.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!voter) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    return res.json({
      success: true,
      message: "Voter updated successfully",
      data: voter
    });
  } catch (err) {
    console.error("Update voter error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete voter
const deleteVoter = async (req, res) => {
  try {
    const { id } = req.params;
    const voter = await Voter.findByIdAndDelete(id);

    if (!voter) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    return res.json({
      success: true,
      message: "Voter deleted successfully"
    });
  } catch (err) {
    console.error("Delete voter error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  getAllVoters,
  verifyVoter,
  updateVoter,
  deleteVoter,
};