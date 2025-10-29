// backend/routes/auth.js
import express from 'express';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js'; // ✅ already handles JWT creation

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, voterid, idNumber, role } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { voterid }, { idNumber }] });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this email, voter ID or ID number' });
    }

    // Create user
    const user = await User.create({ email, password, fullName, voterid, idNumber, role });

    // Issue JWT token
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // If your schema sets password { select: false }, keep .select('+password'); otherwise remove it.
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

export default router;
