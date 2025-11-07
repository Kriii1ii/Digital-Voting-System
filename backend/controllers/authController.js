const User = require('../models/User.js');
const Voter = require('../models/Voter.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//Register User
export const registerUser = async (req, res) => {
  try {
    const { email, voterid, password, fullName } = req.body;

    //Check if voter exists in the Voter database
    const voter = await Voter.findOne({ voterId: voterid });
    if (!voter) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Voter ID — not found in electoral database',
      });
    }

    //Check if this voter has already registered
    if (voter.hasRegistered) {
      return res.status(400).json({
        success: false,
        message: 'This Voter ID is already registered.',
      });
    }

    //Check if user already exists (extra safeguard)
    const existingUser = await User.findOne({ $or: [{ email }, { voterid }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists!' });
    }

    //Create new user
    const user = new User({ email, voterid, password, fullName });
    await user.save();

    // Mark voter as registered
    voter.hasRegistered = true;
    await voter.save();

    // Return created user id to allow frontend to associate biometric upload
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login to continue.',
      data: {
        id: user._id,
        user: {
          _id: user._id,
          email: user.email,
          voterId: user.voterId,
          fullName: user.fullName,
          role: user.role
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};

//Login User
export const loginUser = async (req, res) => {
 try {
    const { email, password } = req.body;

    // Find user by email only
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid credentials' });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
};
