const Candidate = require('../models/Candidate.js');
const Election = require('../models/Election.js');   // ⭐ ADD THIS
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const paginate = require('../utils/paginate.js');


// ⭐ HELPER: Find active election automatically
async function getActiveElection() {
  return await Election.findOne({
    status: { $in: ["ongoing", "open"] }
  });
}


// ---------------------------
// ADD NEW CANDIDATE (ADMIN)
// ---------------------------
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

    // ⭐ Auto get active election
    const activeElection = await getActiveElection();
    if (!activeElection) {
      return res.status(400).json({
        success: false,
        message: 'No active election available. Create or activate an election first.'
      });
    }

    // Hash password
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
      createdBy: req.user ? req.user._id : null,

      // ⭐ AUTO-ASSIGN ACTIVE ELECTION
      election: activeElection._id,
      election_id: String(activeElection._id)
    });

    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'Candidate added and linked to the active election.',
      candidate,
      assignedElection: activeElection
    });

  } catch (error) {
    console.error('Error adding candidate:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};



// ---------------------------
// ADD CANDIDATE (ELECTORAL COMMITTEE)
// ---------------------------
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

    // ⭐ Auto get active election
    const activeElection = await getActiveElection();
    if (!activeElection) {
      return res.status(400).json({
        success: false,
        message: 'No active election available. Create or activate an election first.'
      });
    }

    // Hash password
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
      verified: true,
      candidateId: new mongoose.Types.ObjectId(),
      createdBy: req.user ? req.user._id : null,

      // ⭐ AUTO-ASSIGN ACTIVE ELECTION
      election: activeElection._id,
      election_id: String(activeElection._id)
    });

    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'Candidate added and linked to the active election.',
      data: candidate,
      assignedElection: activeElection
    });

  } catch (error) {
    console.error('Error adding candidate:', error);
    res.status(500).json({ message: error.message, success: false });
  }
};



// ---------------------------
// GET ALL CANDIDATES
// ---------------------------
const getAllCandidates = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

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


// ---------------------------
// GET CANDIDATE BY ID
// ---------------------------
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


// ---------------------------
// UPDATE CANDIDATE
// ---------------------------
const updateCandidate = async (req, res) => {
  try {
    const updates = { ...req.body };

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


// ---------------------------
// DELETE CANDIDATE
// ---------------------------
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


// Export
module.exports = {
  addCandidate,
  addCandidateElectoral,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate
};
