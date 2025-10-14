import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const registerUser = async (req, res) => {
  try {
    const { email, voterid, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { voterid }] });
    if (existingUser)
      return res.status(400).json({ success: false, message: 'User already exists!' });

    const user = new User(req.body);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login to continue.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, voterid } = req.body;

    const user = await User.findOne({ email, voterid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid credentials' });

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
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
