// backend/controllers/voterController.js
import User from '../models/User.js';
import Voter from '../models/Voter.js';

/**
 * GET /api/voter
 * List voters in the official registry (committee/admin)
 * Optional query: q (search by voterId/fullName), registered (true/false)
 */
export const getAllVoters = async (req, res) => {
  try {
    const { q, registered } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { voterId: new RegExp(q, 'i') },
        { fullName: new RegExp(q, 'i') },
      ];
    }
    if (registered === 'true') filter.hasRegistered = true;
    if (registered === 'false') filter.hasRegistered = false;

    const voters = await Voter.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: voters });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * PATCH /api/voter/verify/:voterId
 * Mark a registered user as verified (committee/admin)
 */
export const verifyVoter = async (req, res) => {
  try {
    const { voterId } = req.params;

    const user = await User.findOne({ voterId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found for this voterId' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    // Ensure voter exists in registry
    const registry = await Voter.findOne({ voterId });
    if (!registry) {
      return res.status(404).json({ success: false, message: 'Registry entry not found' });
    }

    user.isVerified = true;
    await user.save();

    return res.json({
      success: true,
      message: 'Voter verified successfully',
      data: { id: user._id, voterId: user.voterId, isVerified: user.isVerified },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
