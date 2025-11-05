const express = require('express');
const generateToken = require('../utils/generateToken.js');
const User = require('../models/User.js');
const Voter = require('../models/Voter.js');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register user (pending until committee verifies)
 * @body    { email, password, fullName, voterid|voterId, idNumber, dateOfBirth, phone, idType, province, district, ward }
 */
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      voterId: voterIdFromBody,
      idNumber,
      dateOfBirth,
      phone,
      idType,
      province,
      district,
      ward,
    } = req.body;

    // Accept either `voterId` or `voterid` from frontend
    const voterIdRaw = voterIdFromBody || req.body.voterid || '';
    const emailNorm = String(email || '').toLowerCase().trim();
    const voterIdNorm = String(voterIdRaw || '').trim();
    const idNumberNorm = String(idNumber || '').trim();

    if (!emailNorm || !password || !fullName || !voterIdNorm) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Find registry entry (prefer voterId, fallback to nationalId)
    const registry = await Voter.findOne({
      $or: [{ voterId: voterIdNorm }, { nationalId: idNumberNorm }],
    });
    if (!registry) {
      return res.status(400).json({ success: false, message: 'Voter not found in the official registry' });
    }

    // FIX: if registry.hasRegistered is true -> already registered
    if (registry.hasRegistered) {
      return res.status(400).json({ success: false, message: 'This Voter ID is already registered.' });
    }

    // Prevent duplicate registration (case-insensitive email + id)
    const userExists = await User.findOne({
      $or: [{ email: emailNorm }, { voterId: voterIdNorm }, { idNumber: idNumberNorm }],
    });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email, voter ID, or ID number' });
    }

    const userData = {
      role: 'voter',
      fullName: fullName.trim(),
      dateOfBirth,
      phone: String(phone || '').trim(),
      email: emailNorm,
      password,
      idType,
      idNumber: idNumberNorm,
      voterId: voterIdNorm,
      province,
      district,
      ward,
      isVerified: false,
    };

    const user = await User.create(userData);

    // mark registry as registered and save the document
    registry.hasRegistered = true;
    await registry.save();

    return res.status(201).json({
      success: true,
      message: 'Registration received. Await Electoral Committee verification.',
      data: { id: user._id, fullName: user.fullName, email: user.email, voterId: user.voterId },
    });
  } catch (err) {
    // Handle duplicate key error explicitly
    if (err && err.code === 11000) {
      const dupField = Object.keys(err.keyValue || {})[0] || 'field';
      return res.status(409).json({ success: false, message: `Duplicate value for ${dupField}`, data: err.message });
    }
    console.error('Registration Error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (only if verified)
 * @body    { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const emailNorm = String(req.body.email || '').toLowerCase().trim();
    const { password } = req.body;

    // Include password even if select:false in schema
    const user = await User.findOne({ email: emailNorm }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: req.t ? req.t('auth.invalid_credentials') : 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: req.t ? req.t('auth.invalid_credentials') : 'Invalid email or password',
      });
    }

    // Block login until committee verifies
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: req.t ? req.t('auth.pending_verification') : 'Your account is pending verification by the Electoral Committee',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: req.t ? req.t('auth.login_success') : 'Login successful',
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
    console.error('LOGIN error:', err);
    return res.status(500).json({
      success: false,
      message: req.t ? req.t('common.server_error') : 'Server Error',
    });
  }
});


module.exports= router;