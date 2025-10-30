
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js'; // ✅ case-sensitive on Linux/Mac
import mongoose from 'mongoose';

/** Determine status from dates */
function computeStatus(startDate, endDate) {
  const now = new Date();
  const s = startDate ? new Date(startDate) : null;
  const e = endDate ? new Date(endDate) : null;

  if (s && now < s) return 'scheduled';
  if (e && now > e) return 'completed';
  return 'ongoing';
}

/** Validate objectId */
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * POST /api/election
 * body: {
 *  title, description, startDate, endDate,
 *  candidates: [{ name, party }...],
 *  eligibleVoterIds?: [string]
 * }
 */
export const createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, candidates = [], eligibleVoterIds = [] } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'title, startDate, and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid startDate or endDate' });
    }
    if (start >= end) {
      return res.status(400).json({ success: false, message: 'startDate must be earlier than endDate' });
    }

    // Normalize candidate payload
    const newCandidates = Array.isArray(candidates)
      ? candidates.filter(c => c && c.name).map(c => ({ name: c.name.trim(), party: c.party?.trim() }))
      : [];

    const status = computeStatus(startDate, endDate);
    const isActive = status === 'ongoing' || status === 'scheduled';

    // Create election
    const election = await Election.create({
      title: title.trim(),
      description: description?.trim(),
      startDate: start,
      endDate: end,
      // keep your existing flag:
      isActive,
      // add if your schema has these fields (ignored otherwise if strict):
      status,
      createdBy: req.user?.id || req.user?._id,
      eligibleVoterIds,
    });

    // Create candidates tied to this election
    let createdCandidates = [];
    if (newCandidates.length) {
      createdCandidates = await Candidate.insertMany(
        newCandidates.map(c => ({ ...c, election: election._id }))
      );
    }

    // Optional: you may also store candidate ids on election if your schema has `candidates: [ObjectId]`
    // election.candidates = createdCandidates.map(c => c._id);
    // await election.save();

    return res.status(201).json({
      success: true,
      message: 'Election created successfully!',
      data: {
        election,
        candidates: createdCandidates.map(c => ({ _id: c._id, name: c.name, party: c.party })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * GET /api/election
 * query: status? = scheduled|ongoing|completed
 */
export const getElections = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status; // will be ignored if schema lacks 'status'

    const elections = await Election.find(filter).sort({ createdAt: -1 }).lean();

    // Attach a lightweight candidate list per election
    const ids = elections.map(e => e._id);
    const candidates = await Candidate.find({ election: { $in: ids } })
      .select('_id name party election')
      .lean();

    const byElection = candidates.reduce((acc, c) => {
      const k = String(c.election);
      (acc[k] ||= []).push({ _id: c._id, name: c.name, party: c.party });
      return acc;
    }, {});

    const data = elections.map(e => ({
      ...e,
      candidates: byElection[String(e._id)] || [],
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * GET /api/election/:id
 */
export const getElectionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid election id' });
    }

    const election = await Election.findById(id).lean();
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });

    const candidates = await Candidate.find({ election: id }).select('_id name party').lean();

    res.status(200).json({
      success: true,
      data: { ...election, candidates },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * PATCH /api/election/:id/end
 * Ends an election immediately (admin/committee)
 */
export const endElection = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid election id' });
    }

    const election = await Election.findById(id);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found' });

    // Update flags
    election.isActive = false;                 // your existing flag
    // If your schema has these fields, they will be saved; if not, ignored:
    election.status = 'completed';
    election.endDate = new Date();

    await election.save();

    res.status(200).json({ success: true, message: 'Election ended successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
