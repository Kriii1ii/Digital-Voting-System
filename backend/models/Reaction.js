// models/reaction.js
const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    type: {
      type: String,
      required: true,
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'support', 'care', 'thumbs_up', 'thumbs_down', 'share', 'good_comment', 'bad_comment'],
      default: 'like',
    },
    // Back-reference fields for faster aggregation and to support mixed schemas
    post_id: { type: String, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
    candidate_id: { type: String, index: true },
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: false },
    election_id: { type: String, index: true },
  },
  { timestamps: true }
);

const Reaction = mongoose.model('Reaction', reactionSchema);
module.exports = Reaction;