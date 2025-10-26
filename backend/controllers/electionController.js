import Election from "../models/Election.js";
import User from "../models/User.js";

//Create new election (only for admin or electoral_committee)
export const createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, candidates } = req.body;

    const newElection = new Election({
      title,
      description,
      startDate,
      endDate,
      candidates,
      createdBy: req.user.id,
    });

    await newElection.save();
    res.status(201).json({ success: true, message: "Election created successfully!", data: newElection });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

//Get all elections
export const getElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: elections });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

//Get single election by ID
export const getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found" });
    res.status(200).json({ success: true, data: election });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

//End an election
export const endElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found" });

    election.isActive = false;
    await election.save();

    res.status(200).json({ success: true, message: "Election ended successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
