const mongoose=require('mongoose');
const crypto = require('crypto');

const voteSchema = new mongoose.Schema({
  voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  timestamp: { type: Date, default: Date.now },
  hash: { type: String }, // blockchain-like hash
}, { timestamps: true });

// Pre-save: create a hash to simulate blockchain integrity
voteSchema.pre('save', function (next) {
  try {
    const data = String(this.voter) + String(this.candidate) + String(this.election) + String(this.timestamp || this.createdAt || Date.now());
    this.hash = crypto.createHash('sha256').update(data).digest('hex');
  } catch (e) {
    // don't block save on hashing failure
    console.warn('Vote pre-save hash failed', e?.message || e);
  }
  next();
});

const Vote = mongoose.model('Vote', voteSchema);
module.exports= Vote;
