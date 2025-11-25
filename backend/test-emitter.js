#!/usr/bin/env node
/**
 * backend/test-emitter.js
 *
 * Standalone test emitter for the Digital Voting System frontend.
 * - Runs a small Express + Socket.IO server on port 5002
 * - Emits `prediction:update` to room `prediction:mock-election` every 3 seconds
 * - Sends mock data for 5 candidates (Prapti, Astha, Max, Lewis, Rabina)
 * - No DB dependencies; run with: `node test-emitter.js`
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const PORT = 5002;
const ELECTION_ID = 'mock-election';
const ROOM = `prediction:${ELECTION_ID}`;

const app = express();
app.use(cors());

app.get('/', (req, res) => res.send('Test Emitter for Digital-Voting-System — emits prediction:update'));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// initial candidate set
const candidates = [
  { candidate_id: 'prapti', name: 'Prapti Baral', votes: 1250, recent_comments: [{ text: 'Great campaign!', sentiment: 0.8 }] },
  { candidate_id: 'astha', name: 'Astha Ghimire', votes: 980, recent_comments: [{ text: 'Loving the ideas', sentiment: 0.6 }] },
  { candidate_id: 'max', name: 'Max Acharya', votes: 640, recent_comments: [{ text: 'Interesting approach', sentiment: 0.2 }] },
  { candidate_id: 'lewis', name: 'Lewis Shrestha', votes: 420, recent_comments: [{ text: 'Not convinced yet', sentiment: -0.1 }] },
  { candidate_id: 'rabina', name: 'Rabina Shah', votes: 310, recent_comments: [{ text: 'Could be better', sentiment: -0.2 }] },
];

function computePredictions() {
  const totalVotes = candidates.reduce((s, c) => s + (c.votes || 0), 0) || 1;
  const preds = candidates.map(c => ({
    candidate_id: c.candidate_id,
    name: c.name,
    votes: c.votes,
    predicted_pct: Number(((c.votes / totalVotes) * 100).toFixed(1)),
    recent_comments: c.recent_comments || [],
  }));

  // determine top candidate id
  const topCandidateId = preds.reduce((best, cur) => (cur.votes > (best.votes || 0) ? cur : best), preds[0]).candidate_id;
  return { predictions: preds, topCandidateId };
}

// Simulate vote increments with occasional spikes
function tick() {
  // small random increments
  candidates.forEach(c => {
    const add = Math.floor(Math.random() * 6); // 0-5
    c.votes += add;
    // occasionally add a short comment
    if (Math.random() < 0.12) {
      const sentiments = [0.9, 0.6, 0.2, -0.1, -0.4];
      const texts = ['Amazing!', 'Great points', 'Could improve', 'Not sure', 'Wow'];
      const idx = Math.floor(Math.random() * texts.length);
      c.recent_comments = c.recent_comments || [];
      c.recent_comments.push({ text: texts[idx], sentiment: sentiments[idx] });
      if (c.recent_comments.length > 5) c.recent_comments.shift();
    }
  });

  // occasional spike
  if (Math.random() < 0.15) {
    const i = Math.floor(Math.random() * candidates.length);
    const spike = Math.floor(40 + Math.random() * 120);
    candidates[i].votes += spike;
    console.log(`[Emitter] Spike +${spike} to ${candidates[i].candidate_id}`);
  }

  const payload = {
    electionId: ELECTION_ID,
    data: computePredictions(),
  };

  io.to(ROOM).emit('prediction:update', payload);
  console.log(`[Emitter] emitted prediction:update to ${ROOM} — totalVotes=${candidates.reduce((s,c)=>s+c.votes,0)}`);
}

io.on('connection', (socket) => {
  console.log('[Emitter] socket connected', socket.id, 'from', socket.handshake.address || socket.conn.remoteAddress);

  socket.on('joinElection', (eid) => {
    const room = `prediction:${eid}`;
    socket.join(room);
    console.log(`[Emitter] socket ${socket.id} joined room ${room}`);
    // send immediate payload to new subscriber
    const payload = { electionId: ELECTION_ID, data: computePredictions() };
    socket.emit('prediction:update', payload);
  });

  socket.on('joinPrediction', (eid) => {
    const room = `prediction:${eid}`;
    socket.join(room);
    console.log(`[Emitter] socket ${socket.id} joined room ${room} (joinPrediction)`);
    const payload = { electionId: ELECTION_ID, data: computePredictions() };
    socket.emit('prediction:update', payload);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Emitter] socket disconnected', socket.id, 'reason', reason);
  });
});

server.listen(PORT, () => {
  console.log(`Test emitter running at http://localhost:${PORT} — emitting to room ${ROOM} every 3s`);
  // emit right away, then every 3s
  tick();
  setInterval(tick, 3000);
});

process.on('SIGINT', () => {
  console.log('[Emitter] shutting down');
  process.exit(0);
});
