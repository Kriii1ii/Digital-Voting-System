const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  voterId: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date },
  nationalId: { type: String },
  hasRegistered: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },  // important
}, { timestamps: true });

const Voter = mongoose.models.Voter || mongoose.model('Voter', voterSchema);
module.exports = Voter;
