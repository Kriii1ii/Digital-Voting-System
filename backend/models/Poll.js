const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: false },
    election_id: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pollSchema.index({ election_id: 1 }, { unique: true });

module.exports = mongoose.models.Poll || mongoose.model('Poll', pollSchema);

