import Candidate from '../models/Candidate.js';
import Election from '../models/Election.js';

export const predictWinner = async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId).populate('candidates');

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Simulate AI scoring based on engagements
    const predictions = election.candidates.map(candidate => {
      const score = (candidate.likes || 0) * 0.6 + (candidate.comments || 0.3) * 1 + (candidate.shares || 0.1) * 2;
      return { name: candidate.name, score };
    });

    const sorted = predictions.sort((a, b) => b.score - a.score);
    const predictedWinner = sorted[0];

    res.status(200).json({
      success: true,
      message: 'Predicted winner based on engagement analysis',
      predictedWinner,
      allCandidates: sorted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
