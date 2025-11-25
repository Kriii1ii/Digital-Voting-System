const Candidate = require('../models/Candidate.js');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const paginate = require('../utils/paginate.js');

// Add new candidate
const addCandidate = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      partyName,
      manifesto,
      age,
      gender,
      position,
      photo,
      politicalSign
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !partyName || !age || !gender || !position) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    // Check duplicate email
    const existing = await Candidate.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already used by another candidate.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const candidate = new Candidate({
      fullName,
      email,
      password: hashedPassword,
      partyName,
      manifesto,
      age,
      gender,
      position,
      photo: photo || '',
      politicalSign: politicalSign || '',
      createdBy: req.user ? req.user._id : null // optional: set after auth
    });

    await candidate.save();
    res.status(201).json({
      message: 'Candidate added successfully!',
      candidate
    });
  } catch (error) {
    console.error('Error adding candidate:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

const addCandidateElectoral = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      partyName,
      manifesto,
      age,
      gender,
      position,
      photo,
      politicalSign
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !partyName || !age || !gender || !position) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    // Check duplicate email
    const existing = await Candidate.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already used by another candidate.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const candidate = new Candidate({
      fullName,
      email,
      password: hashedPassword,
      partyName,
      manifesto,
      age,
      gender,
      position,
      photo: photo || '',
      politicalSign: politicalSign || '',
      verified:true,
      candidateId: new mongoose.Types.ObjectId(),
      createdBy: req.user ? req.user._id : null // optional: set after auth
    });

    await candidate.save();
    res.status(201).json({
      message: 'Candidate added successfully!',
      success:true,
      data: candidate,
    });
  } catch (error) {
    console.error('Error adding candidate:', error);
    res.status(500).json({ message: error.message, success:false });
  }
};


// Get all candidates with search and pagination
const getAllCandidates = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter for search
    const filter = {};
    if (q) {
      filter.$or = [
        { fullName: new RegExp(q, "i") },
        { partyName: new RegExp(q, "i") },
        { position: new RegExp(q, "i") }
      ];
    }

    const totalCandidates = await Candidate.countDocuments(filter);

    const candidates = await Candidate.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      totalCandidates,
      totalPages: Math.ceil(totalCandidates / limit),
      currentPage: parseInt(page),
      results: candidates
    });

  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ success: false, message: "Error fetching candidates." });
  }
};


// Get candidate by ID
const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }
    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching candidate.' });
  }
};


// Update candidate
const updateCandidate = async (req, res) => {
  try {
    const updates = { ...req.body };

    // If updating password, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    res.status(200).json({
      message: 'Candidate updated successfully.',
      updatedCandidate
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating candidate.' });
  }
};


// Delete candidate
const deleteCandidate = async (req, res) => {
  try {
    const deleted = await Candidate.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    res.status(200).json({ message: 'Candidate deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting candidate.' });
  }
};
// Export (CommonJS)
module.exports = {
  addCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  addCandidateElectoral
};
