/**
 * Simple mock voting simulator that emits `prediction:update` events
 * to Socket.IO rooms like `prediction:<electionId>`.
 *
 * - simulates 5 candidates with different behaviour
 * - emits every 2-3s for small increments and when spikes occur
 */
module.exports = function initMockVotes(io) {
  try {
    const ELECTION_ID = process.env.MOCK_ELECTION_ID || 'mock-election';
    const ROOM = `prediction:${ELECTION_ID}`;

    const candidates = [
      { id: 'prapti', name: 'Prapti Baral' },
      { id: 'astha', name: 'Astha Ghimire' },
      { id: 'max', name: 'Max Acharya' },
      { id: 'lewis', name: 'Lewis Shrestha' },
      { id: 'rabina', name: 'Rabina Shah' },
    ];

    // initial votes and sentiment (will be overridden from DB if available)
    const state = candidates.reduce((acc, c, i) => {
      acc[c.id] = {
        id: c.id,
        name: c.name,
        votes: 10 + Math.floor(Math.random() * 20),
        sentiment: (Math.random() - 0.5) * 0.2, // small bias
        comments: [],
      };
      return acc;
    }, {});

    // Try to sync initial candidate info (names and initialVotes) from database when MONGO_URI is provided.
    (async function trySyncFromDb() {
      const MONGO = process.env.MONGO_URI;
      if (!MONGO) return;
      try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db();
        const col = db.collection('candidates');
        const q = { $or: [{ election_id: ELECTION_ID }, { election: ELECTION_ID }, { election: { $exists: false } }] };
        const docs = await col.find({ election_id: ELECTION_ID }).toArray().catch(() => []);
        if (docs && docs.length) {
          console.log(`[mockVotes] synced ${docs.length} candidates from DB for election=${ELECTION_ID}:`, docs.map(x => ({ id: x._id || x.candidate_id, name: x.name })));
          docs.forEach(d => {
            // candidate id may be in _id (string) or candidate_id field
            const cid = (d._id && typeof d._id === 'string') ? d._id : (d.candidate_id || (d._id ? String(d._id) : null));
            if (!cid) return;
            // ensure our mock state has the candidate key; if not, create entry
            if (!state[cid]) state[cid] = { id: cid, name: d.name || (d.fullName || cid), votes: d.initialVotes || 0, sentiment: 0, comments: [] };
            else {
              state[cid].name = d.name || state[cid].name;
              state[cid].votes = Number(d.initialVotes || state[cid].votes || 0);
            }
          });
        }
        await client.close();
      } catch (err) {
        console.warn('mockVotes: failed to sync candidates from DB', err?.message || err);
      }
    })();

    // schedule a viral moment for Max between 20-90s
    const viralIn = 20000 + Math.floor(Math.random() * 70000);
    setTimeout(() => {
      const add = 150 + Math.floor(Math.random() * 200);
      state['max'].votes += add;
      state['max'].comments.push({ text: 'Viral moment! #Max', sentiment: 0.9 });
      emitUpdate();
    }, viralIn);

    // helper: generate random comment
    function genComment(candidateId) {
      const positive = Math.random() > 0.4;
      const textsPos = ['Great!', 'Love this candidate', 'Amazing speech', 'So inspiring'];
      const textsNeg = ['Not convinced', 'Bad choice', 'This is worrying', 'Dislike'];
      const text = positive ? textsPos[Math.floor(Math.random() * textsPos.length)] : textsNeg[Math.floor(Math.random() * textsNeg.length)];
      return { text, sentiment: positive ? (0.2 + Math.random() * 0.8) : (-0.2 - Math.random() * 0.8) };
    }

    // history storage for metrics (rolling)
    const HISTORY_LIMIT = 100;
    const history = []; // each entry: { ts, entries: [{candidate_id, votes, sentiment, predicted_pct, actual_pct, predicted_win, actual_win}] }

    const { calculateClassificationMetrics, calculateRegressionMetrics, calculateBrierScore } = require('./metricsCalculator');

    function emitUpdate() {
      // build predictions array
      const list = Object.values(state).map((s) => ({
        candidate_id: s.id,
        name: s.name,
        votes: s.votes,
        sentiment: s.sentiment,
      }));

      const totalVotes = list.reduce((a, b) => a + (b.votes || 0), 0) || 1;

      // compute actual_pct (ground-truth) and predicted_pct (model output influenced by sentiment + noise)
      const predictions = list.map((l) => {
        const base = ((l.votes || 0) / totalVotes) * 100; // actual share
        const actual_pct = Number(base.toFixed(2));
        const sentimentAdj = (l.sentiment || 0) * 8; // sentiment influence
        const modelNoise = (Math.random() - 0.5) * 1.5; // small model noise
        const predictedRaw = base + sentimentAdj + modelNoise;
        const predicted_pct = Number(Math.max(0, Math.min(100, predictedRaw)).toFixed(2));
        return {
          candidate_id: l.candidate_id,
          name: l.name,
          votes: l.votes,
          predicted_pct,
          actual_pct,
          recent_comments: (state[l.candidate_id]?.comments || []).slice(-3).map(c => ({ text: c.text, sentiment: Number((c.sentiment || 0).toFixed(2)) })),
        };
      });

      // find top
      const top = [...predictions].sort((a, b) => b.predicted_pct - a.predicted_pct)[0];

      // debug: show names being emitted (helpful when tracking placeholders)
      try {
        console.debug('[mockVotes] emitting prediction:update', predictions.map(p => ({ id: p.candidate_id, name: p.name, votes: p.votes, predicted_pct: p.predicted_pct })));
      } catch (e) {}

      // emit prediction update (include usedFallback=false to indicate live simulator values)
      io.to(ROOM).emit('prediction:update', {
        electionId: ELECTION_ID,
        data: {
          predictions,
          topCandidateId: top?.candidate_id,
          usedFallback: false,
        },
      });

      // record history entry
      try {
        const ts = Date.now();
        // determine actual winner (highest actual_pct)
        const actualTop = [...predictions].sort((a,b)=>b.actual_pct - a.actual_pct)[0];
        const predictedTop = top;
        const entries = predictions.map(p => ({
          candidate_id: p.candidate_id,
          name: p.name,
          votes: p.votes,
          sentiment: state[p.candidate_id]?.sentiment || 0,
          predicted_pct: p.predicted_pct,
          actual_pct: p.actual_pct,
          predicted_win: p.candidate_id === (predictedTop?.candidate_id),
          actual_win: p.candidate_id === (actualTop?.candidate_id),
        }));

        history.push({ ts, entries });
        if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
      } catch (e) {
        console.warn('history push failed', e);
      }
    }

    // runtime config
    let running = true;
    let speed = Number(process.env.MOCK_SPEED) || 1; // 1x by default
    const baseMs = 2500; // base interval ~2.5s

    // main tick logic
    const tick = () => {
      // small growth patterns
      // Prapti: steady growth every ~30s + micro increments
      if (Math.random() < 0.6) {
        // choose a candidate weighted
        const r = Math.random();
        if (r < 0.28) state['prapti'].votes += Math.random() < 0.1 ? 2 : 1;
        else if (r < 0.5) state['lewis'].votes += 0; // slow
        else if (r < 0.75) state['rabina'].votes += Math.random() < 0.6 ? 1 : 0;
        else state['max'].votes += 1;
      }

      // random base increment for all with low chance
      Object.keys(state).forEach((id) => {
        if (Math.random() < 0.15) {
          state[id].votes += 1;
          // random comment sometimes
          if (Math.random() < 0.08) {
            const c = genComment(id);
            state[id].comments.push(c);
            state[id].sentiment = ((state[id].sentiment * 5) + c.sentiment) / 6; // smooth
          }
        }
      });

      // occasional spikes for Astha
      if (Math.random() < 0.07) {
        const spike = 5 + Math.floor(Math.random() * 6);
        state['astha'].votes += spike;
        state['astha'].comments.push({ text: 'Spike!', sentiment: 0.5 });
      }

      // Prapti steady growth every ~30s: we emulate with lower-prob but larger add
      if (Math.random() < 0.08) {
        const add = 1 + Math.floor(Math.random() * 3);
        state['prapti'].votes += add;
      }

      // Rabina fluctuates: sometimes lose sentiment
      if (Math.random() < 0.05) {
        const c = genComment('rabina');
        state['rabina'].comments.push(c);
        state['rabina'].sentiment = ((state['rabina'].sentiment * 5) + c.sentiment) / 6;
      }

      // occasionally generate a viral micro-burst for max after initial viral
      if (Math.random() < 0.02) {
        state['max'].votes += 20 + Math.floor(Math.random() * 40);
        state['max'].comments.push({ text: 'Max trending again', sentiment: 0.6 });
      }

      emitUpdate();
    };

    let intervalRef = null;
    function scheduleInterval() {
      if (intervalRef) clearInterval(intervalRef);
      if (!running) return;
      const jitter = Math.floor(Math.random() * 1000);
      const ms = Math.max(200, Math.round((baseMs + jitter) / Math.max(0.1, speed)));
      intervalRef = setInterval(tick, ms);
    }

    // start scheduled ticks
    scheduleInterval();

    // expose control handlers via socket.io
    io.on('connection', (socket) => {
      // listen for admin controls
      socket.on('mock:start', () => {
        running = true;
        scheduleInterval();
        io.to(ROOM).emit('mock:status', { running, speed });
      });

      socket.on('mock:stop', () => {
        running = false;
        if (intervalRef) clearInterval(intervalRef);
        intervalRef = null;
        io.to(ROOM).emit('mock:status', { running, speed });
      });

      socket.on('mock:setSpeed', (payload) => {
        const s = Number(payload?.speed) || 1;
        speed = s;
        scheduleInterval();
        io.to(ROOM).emit('mock:status', { running, speed });
      });

      socket.on('mock:spike', (payload) => {
        const candidateId = payload?.candidateId;
        const amount = Number(payload?.amount) || 50;
        if (candidateId && state[candidateId]) {
          state[candidateId].votes += amount;
          state[candidateId].comments.push({ text: `Manual spike +${amount}`, sentiment: 0.8 });
          emitUpdate();
          io.to(ROOM).emit('mock:spike:ack', { candidateId, amount });
        }
      });

      socket.on('mock:getStatus', () => {
        socket.emit('mock:status', { running, speed });
      });
    });

    // cleanup handle
    const shutdown = () => {
      clearInterval(intervalRef);
      clearInterval(metricsIntervalRef);
      io.removeAllListeners?.('connection');
    };

    // metrics computation and emission
    function computeAndEmitMetrics() {
      try {
        if (!history.length) return;
        // per-candidate arrays
        const candidateIds = Object.keys(state);
        const perCandidate = {};
        candidateIds.forEach(id => { perCandidate[id] = { predicted: [], actual: [], probs: [], winsPred: [], winsActual: [] }; });

        history.forEach(h => {
          h.entries.forEach(e => {
            const c = perCandidate[e.candidate_id];
            if (!c) return;
            c.predicted.push(e.predicted_pct);
            c.actual.push(e.actual_pct);
            c.probs.push(e.predicted_pct / 100);
            c.winsPred.push(e.predicted_win ? 1 : 0);
            c.winsActual.push(e.actual_win ? 1 : 0);
          });
        });

        const overall = { perCandidate: {}, aggregated: {} };

        // per-candidate metrics
        Object.keys(perCandidate).forEach(id => {
          const c = perCandidate[id];
          const reg = calculateRegressionMetrics(c.predicted, c.actual);
          const cls = calculateClassificationMetrics(c.winsPred, c.winsActual);
          const brier = calculateBrierScore(c.probs, c.winsActual);
          overall.perCandidate[id] = { regression: reg, classification: cls, brier };
        });

        // aggregated regression across all candidates
        const flatPred = [], flatAct = [];
        Object.values(perCandidate).forEach(c => { flatPred.push(...c.predicted); flatAct.push(...c.actual); });
        const aggregatedRegression = calculateRegressionMetrics(flatPred, flatAct);

        // winner-level accuracy (predictedTop == actualTop)
        const winnerPred = [];
        const winnerAct = [];
        history.forEach(h => {
          // find predicted top from entries
          const predTop = h.entries.reduce((a,b)=> (b.predicted_pct>a.predicted_pct?b:a));
          const actTop = h.entries.reduce((a,b)=> (b.actual_pct>a.actual_pct?b:a));
          winnerPred.push(predTop.candidate_id);
          winnerAct.push(actTop.candidate_id);
        });
        const total = winnerAct.length;
        let correct = 0;
        for (let i=0;i<total;i++) if (winnerPred[i] === winnerAct[i]) correct++;
        const winnerAccuracy = total === 0 ? 0 : (correct / total);

        overall.aggregated = { regression: aggregatedRegression, winnerAccuracy };

        const payload = { ts: Date.now(), overall, perCandidate: overall.perCandidate, winnerAccuracy };
        io.to(ROOM).emit('mock:metrics', { electionId: ELECTION_ID, data: payload });
      } catch (e) {
        console.warn('computeAndEmitMetrics failed', e);
      }
    }

    // compute metrics every 5 minutes (300000ms)
    const METRICS_INTERVAL_MS = 5 * 60 * 1000;
    const metricsIntervalRef = setInterval(computeAndEmitMetrics, METRICS_INTERVAL_MS);

    // also respond to mock:getMetrics requests
    io.on('connection', (socket) => {
      socket.on('mock:getMetrics', () => {
        computeAndEmitMetrics();
      });
    });

    console.log('[mockVotes] started for', ROOM);

    // emit initial state immediately
    emitUpdate();

    return Promise.resolve({ shutdown });
  } catch (err) {
    console.error('mockVotes start failed', err);
    return Promise.reject(err);
  }
};
