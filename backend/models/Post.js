const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: false },
    election_id: { type: String, required: false, index: true },
    candidate_id: { type: String, required: false, index: true },
    text: { type: String, default: '' },
    comments: { type: String, default: 0 },
    media: { type: Object, default: null },
    reactionsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
module.exports = Post;