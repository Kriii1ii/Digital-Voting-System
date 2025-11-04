import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: false },
    text: { type: String, default: '' },
    media: { type: Object, default: null },
    reactionsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
export default Post;
