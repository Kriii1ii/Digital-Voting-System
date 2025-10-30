import User from '../models/User.js';

/**
 * Validate if a voter is eligible to vote
 * @param {String} voterId - MongoDB ObjectId of the voter
 * @returns {Object} Result with status and message
 */
const validateVoter = async (voterId) => {
  try {
    const voter = await User.findById(voterId);

    if (!voter) {
      return { valid: false, message: 'Voter not found.' };
    }

    if (voter.role !== 'voter') {
      return { valid: false, message: 'Only voters can cast votes.' };
    }

    if (voter.hasVoted) {
      return { valid: false, message: 'Voter has already cast their vote.' };
    }

    return { valid: true, message: 'Voter is eligible to vote.' };
  } catch (error) {
    console.error('Error validating voter:', error.message);
    return { valid: false, message: 'Server error during voter validation.' };
  }
};

export default validateVoter;
