import mongoose from "mongoose";
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { createElection, getElections } from '../controllers/electionController.js';

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const electionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    candidates: [candidateSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Election = mongoose.model("Election", electionSchema);
export default Election;
