// backend/routes/auth.js
import express from 'express';
import User from '../models/User.js';
import Voter from '../models/Voter.js';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register user (pending until committee verifies)
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      voterid,      // client sends `voterid`
      idNumber,
      role,         // ignore elevated roles from client
      dateOfBirth,  // if you collect these on the form
      phone,
      idType,
      province,
      district,
      ward
    } = req.body;

    // Normalize & guard role (no self-assigning admin/committee)
    const safeRole = 'voter';

    // 1) Check registry (authoritative list)
    const voterId = (voterid || '').trim();
    const registry = await Voter.findOne({ voterId });

    if (!registry) {
      return res.status(400).json({
        success: false,
        message: 'VoterId not found in the official registry',
      });
    }

    // Optional: simple name match (case-insensitive)
    const sameName =
      (registry.fullName || '').trim().toLowerCase() === (fullName || '').trim().toLowerCase();
    if (!sameName) {
      return res.status(400).json({
        success: false,
        message: 'Provided full name does not match the registry',
      });
    }

    if (registry.hasRegistered) {
      return res.status(400).json({
        success: false,
        message: 'This VoterId has already been registered',
      });
    }

    // 2) Prevent duplicate user accounts
    const userExists = await User.findOne({
      $or: [{ email: (email || '').toLowerCase().trim() }, { voterId }, { idNumber }],
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email, voter ID, or ID number',
      });
    }

    // 3) Create user in PENDING state (not verified)
    const user = await User.create({
      email,
      password,
      fullName,
      voterId,          // canonical field (alias to voterid)
      idNumber,
      role: safeRole,
      dateOfBirth,
      phone,
      idType,
      province,
      district,
      ward,
      isVerified: false // alias to `verified` in your schema
    });

    // 4) Mark registry as registered (but not verified yet)
    registry.hasRegistered = true;
    await registry.save();

    // No token yet (pending verification)
    return res.status(201).json({
      success: true,
      message: 'Registration received. Await Electoral Committee verification.',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        voterId: user.voterId,
        isVerified: user.isVerified, // false
        role: user.role,             // 'voter'
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (only if verified)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // password is select:false in model, so include it here
    const user = await User.findOne({ email: (email || '').toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    // Block login until committee verifies
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending verification by the Electoral Committee',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        voterId: user.voterId,
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
