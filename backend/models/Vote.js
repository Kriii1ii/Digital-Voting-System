import mongoose from 'mongoose';
import crypto from 'crypto';

const voteSchema = new mongoose.Schema({
  voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  timestamp: { type: Date, default: Date.now },
  hash: { type: String }, // blockchain-like hash
}, { timestamps: true });

// Pre-save: create a hash to simulate blockchain integrity
voteSchema.pre('save', function (next) {
  const data = this.voter + this.candidate + this.election + this.timestamp;
  this.hash = crypto.createHash('sha256').update(data).digest('hex');
  next();
});

const Vote = mongoose.model('Vote', voteSchema);
export default Vote;
