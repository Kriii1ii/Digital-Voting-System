import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    type: { type: String, required: true }, // e.g., 'like','heart','support','thumbs_down'
  },
  { timestamps: true }
);

const Reaction = mongoose.model('Reaction', reactionSchema);
export default Reaction;
