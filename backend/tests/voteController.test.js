const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Vote = require('../models/Vote');
const PollVote = require('../models/PollVote');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const User = require('../models/User');

describe('POST /api/votes/cast', () => {
  let testElection;
  let testCandidate;
  let testUser;
  let authToken;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test_digital_voting';
    await mongoose.connect(mongoUri);
    
    testElection = await Election.create({
      title: 'Test Election',
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      isActive: true,
      status: 'ongoing',
    });

    testUser = await User.create({
      fullName: 'Test Voter',
      email: 'voter@test.com',
      password: 'hashedpassword',
      role: 'voter',
      verified: true,
    });

    testCandidate = await Candidate.create({
      fullName: 'Test Candidate',
      email: 'candidate@test.com',
      password: 'hashedpassword',
      partyName: 'Test Party',
      age: 25,
      gender: 'male',
      position: 'Mayor',
      election: testElection._id,
      election_id: testElection._id.toString(),
    });

    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await Vote.deleteMany({});
    await PollVote.deleteMany({});
    await Candidate.deleteMany({});
    await Election.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Vote.deleteMany({});
    await PollVote.deleteMany({});
  });

  it('should cast a vote successfully when candidate is linked to election', async () => {
    const response = await request(app)
      .post('/api/votes/cast')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        electionId: testElection._id.toString(),
        candidateId: testCandidate._id.toString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('leaderboard');
    
    const vote = await Vote.findOne({ voter: testUser._id, election: testElection._id });
    expect(vote).toBeTruthy();
    
    const pollVote = await PollVote.findOne({ 
      user: testUser._id, 
      election_id: testElection._id.toString() 
    });
    expect(pollVote).toBeTruthy();
  });

  it('should return 400 when candidate has no election_id and multiple elections exist', async () => {
    await Election.create({
      title: 'Another Election',
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      isActive: true,
      status: 'ongoing',
    });

    const unlinkedCandidate = await Candidate.create({
      fullName: 'Unlinked Candidate',
      email: 'unlinked@test.com',
      password: 'hashedpassword',
      partyName: 'Test Party',
      age: 25,
      gender: 'male',
      position: 'Mayor',
    });

    const response = await request(app)
      .post('/api/votes/cast')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        electionId: testElection._id.toString(),
        candidateId: unlinkedCandidate._id.toString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('not linked to this election');
  });

  it('should auto-assign election_id when only one election exists', async () => {
    await Election.deleteMany({ _id: { $ne: testElection._id } });
    
    const unlinkedCandidate = await Candidate.create({
      fullName: 'Auto Assign Candidate',
      email: 'auto@test.com',
      password: 'hashedpassword',
      partyName: 'Test Party',
      age: 25,
      gender: 'male',
      position: 'Mayor',
    });

    const response = await request(app)
      .post('/api/votes/cast')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        electionId: testElection._id.toString(),
        candidateId: unlinkedCandidate._id.toString(),
      });

    expect(response.status).toBe(201);
    
    const updated = await Candidate.findById(unlinkedCandidate._id);
    expect(updated.election_id).toBe(testElection._id.toString());
  });

  it('should return 400 when user has already voted', async () => {
    await Vote.create({
      voter: testUser._id,
      candidate: testCandidate._id,
      election: testElection._id,
    });

    const response = await request(app)
      .post('/api/votes/cast')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        electionId: testElection._id.toString(),
        candidateId: testCandidate._id.toString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already voted');
  });

  it('should return 400 when electionId is missing', async () => {
    const response = await request(app)
      .post('/api/votes/cast')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        candidateId: testCandidate._id.toString(),
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Missing required fields');
  });
});

