const mongoose = require('mongoose');

const INTERACTION_TYPES = [
  'like',
  'wow',
  'angry',
  'love',
  'haha',
  'sad',
  'support',
  'care',
  'good_comment',
  'bad_comment',
  'share',
];

const pollInteractionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user_id: { type: String, index: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: false },
    post_id: { type: String, index: true },
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: false },
    election_id: { type: String, required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
    candidate_id: { type: String, required: false, index: true },
    type: { type: String, enum: INTERACTION_TYPES, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pollInteractionSchema.index({ user: 1, post: 1, type: 1 }, { unique: false });

module.exports = mongoose.models.PollInteraction || mongoose.model('PollInteraction', pollInteractionSchema);
module.exports.INTERACTION_TYPES = INTERACTION_TYPES;

