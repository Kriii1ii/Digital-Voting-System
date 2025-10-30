import express from 'express';
import Voter from '../models/Voter.js';
import User from '../models/User.js';
import { protect, authorize, requireVerified, adminOnly, committeeOnly, committeeOrAdmin } from '../middleware/authMiddleware.js';
import { verifyVoter, getAllVoters } from '../controllers/voterController.js';

const router = express.Router();
// Only committee/admin can see all voters
router.get('/', protect, committeeOrAdmin, getAllVoters);

// Verify a voter (committee or admin only)
router.patch('/verify/:voterId', protect, committeeOrAdmin, verifyVoter);

// POST /api/voter/bulk   (committee/admin) — add many voters
router.post('/bulk', protect, authorize('committee', 'admin'), async (req, res) => {
  try {
    const { voters } = req.body; // [{voterId, fullName, dob?, nationalId?}, ...]
    if (!Array.isArray(voters) || voters.length === 0)
      return res.status(400).json({ success: false, message: 'No voters provided' });

    // upsert to avoid duplicates (by voterId)
    const ops = voters.map(v =>
      ({
        updateOne: {
          filter: { voterId: v.voterId },
          update: {
            $setOnInsert: {
              voterId: v.voterId,
              fullName: v.fullName,
              dob: v.dob,
              nationalId: v.nationalId,
              hasRegistered: false,
            }
          },
          upsert: true
        }
      })
    );

    const result = await Voter.bulkWrite(ops);
    return res.status(201).json({ success: true, message: 'Voters imported', result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/voter/check/:voterId  — check registry status
router.get('/check/:voterId', protect, authorize('committee', 'admin'), async (req, res) => {
  try {
    const { voterId } = req.params;
    const v = await Voter.findOne({ voterId });
    if (!v) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: v });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PATCH /api/voter/verify/:voterId — mark user verified
router.patch('/verify/:voterId', protect, authorize('committee', 'admin'), async (req, res) => {
  try {
    const { voterId } = req.params;

    // 1) user must exist and be pending
    const user = await User.findOne({ voterId });
    if (!user) return res.status(404).json({ success: false, message: 'User not found for this voterId' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'User already verified' });

    // 2) registry must exist
    const registry = await Voter.findOne({ voterId });
    if (!registry) return res.status(404).json({ success: false, message: 'Registry entry not found' });

    // 3) verify
    user.isVerified = true;
    await user.save();

    return res.json({ success: true, message: 'Voter verified', data: { id: user._id, voterId: user.voterId, isVerified: user.isVerified } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;
