const mongoose = require('mongoose');
const { buildElectionPrediction } = require('../services/predictionPollService');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const PollInteraction = require('../models/PollInteraction');
const PollVote = require('../models/PollVote');

describe('buildElectionPrediction', () => {
  let testElection;
  let testCandidate;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test_digital_voting';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await PollInteraction.deleteMany({});
    await PollVote.deleteMany({});
    await Candidate.deleteMany({});
    await Election.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await PollInteraction.deleteMany({});
    await PollVote.deleteMany({});
    await Candidate.deleteMany({});
    await Election.deleteMany({});

    testElection = await Election.create({
      title: 'Test Election',
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      isActive: true,
      status: 'ongoing',
    });

    testCandidate = await Candidate.create({
      fullName: 'Test Candidate',
      email: 'test@test.com',
      password: 'hashed',
      partyName: 'Test Party',
      age: 25,
      gender: 'male',
      position: 'Mayor',
      election: testElection._id,
      election_id: testElection._id.toString(),
    });
  });

  it('should return safe fallback when no candidates exist', async () => {
    await Candidate.deleteMany({});
    
    const result = await buildElectionPrediction({ 
      electionId: testElection._id.toString() 
    });

    expect(result).toHaveProperty('candidates');
    expect(Array.isArray(result.candidates)).toBe(true);
    expect(result.candidates.length).toBe(0);
    expect(result.topCandidateId).toBeNull();
  });

  it('should return predictions when interactions exist', async () => {
    const testUser = new mongoose.Types.ObjectId();
    
    await PollInteraction.create({
      user: testUser,
      user_id: testUser.toString(),
      election: testElection._id,
      election_id: testElection._id.toString(),
      candidate: testCandidate._id,
      candidate_id: testCandidate._id.toString(),
      type: 'like',
    });

    const result = await buildElectionPrediction({ 
      electionId: testElection._id.toString() 
    });

    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates[0]).toHaveProperty('id');
    expect(result.candidates[0]).toHaveProperty('percentage');
    expect(result.candidates[0].percentage).toBeGreaterThanOrEqual(0);
    expect(result.candidates[0].percentage).toBeLessThanOrEqual(100);
  });

  it('should handle empty election_id gracefully', async () => {
    const result = await buildElectionPrediction({ electionId: null });
    
    expect(result).toHaveProperty('candidates');
    expect(Array.isArray(result.candidates)).toBe(true);
  });
});

