
import Candidate from '../models/Candidate.js';

// Add new candidate
export const addCandidate = async (req, res) => {
  try {
    const { fullName, partyName, manifesto, age, gender, position, photo } = req.body;

    if (!fullName || !partyName || !age || !gender || !position) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    const candidate = new Candidate({
      fullName,
      partyName,
      manifesto,
      age,
      gender,
      position,
      photo,
      createdBy: req.user ? req.user._id : null, // optional: set after auth
    });

    await candidate.save();
    res.status(201).json({ message: 'Candidate added successfully!', candidate });
  } catch (error) {
    console.error('Error adding candidate:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Get all candidates
export const getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching candidates.' });
  }
};

// Get candidate by ID
export const getCandidateById = async (req, res) => {
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
export const updateCandidate = async (req, res) => {
  try {
    const updatedCandidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedCandidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }
    res.status(200).json({ message: 'Candidate updated successfully.', updatedCandidate });
  } catch (error) {
    res.status(500).json({ message: 'Error updating candidate.' });
  }
};

// Delete candidate
export const deleteCandidate = async (req, res) => {
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
