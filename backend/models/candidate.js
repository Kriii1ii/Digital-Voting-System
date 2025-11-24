const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    password: { type: String, required: true, select: false },

    partyName: { type: String, required: true, trim: true },

    manifesto: { type: String, default: '' },

    verified: {type: Boolean, default:false},

    age: { type: Number, required: true, min: 21 },

    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },

    position: {
      type: String,
      required: true,
    },

    photo: {
      type: String,
      required:false,
      default: '/defaultPP.jpg',
    },

    politicalSign: {
      type: String, // image URL for political symbol
      default: '/defaultPP.jpg',
      required:false
    },

    totalVotes: {
      type: Number,
      required: false,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required:false,
      ref: 'User',
    },
    // Link to election (required going forward)
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true,
      index: true,
    },
    election_id: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
