const mongoose = require('mongoose');

const pollVoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user_id: { type: String, index: true },
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: false },
    election_id: { type: String, required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    candidate_id: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pollVoteSchema.index({ user: 1, election_id: 1 }, { unique: true });

module.exports = mongoose.models.PollVote || mongoose.model('PollVote', pollVoteSchema);

