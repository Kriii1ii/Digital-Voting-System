import mongoose from 'mongoose';
import axios from 'axios';

const AI_PREDICTION_URL = process.env.AI_PREDICTION_URL || 'http://localhost:8000';
const DEFAULT_ELECTION_ID = process.env.ELECTION_ID || null;
const DEBOUNCE_MS = Number(process.env.PREDICTION_DEBOUNCE_MS || 30000);

// Map<electionId, timestamp>
const lastUpdateByElection = new Map();
let streams = [];

function now() {
  return Date.now();
}

async function resolveElectionIdFromDocument(doc) {
  if (!doc) return null;
  // common field names
  if (doc.election_id) return doc.election_id;
  if (doc.electionId) return doc.electionId;
  if (doc.election) return doc.election;
  // if it's a reaction/comment referencing a post, try to fetch the post
  const postId = doc.postId || doc.post_id || doc.post?.toString?.();
  if (postId) {
    try {
      const post = await mongoose.connection.collection('posts').findOne({ _id: typeof postId === 'string' ? new mongoose.Types.ObjectId(postId) : postId });
      if (post) return post.election_id || post.electionId || post.election || null;
    } catch (err) {
      // ignore; best-effort
      console.debug('Could not resolve post->electionId', err.message || err);
    }
  }
  return null;
}

async function fetchAndEmit(io, electionId) {
  if (!electionId) electionId = DEFAULT_ELECTION_ID;
  if (!electionId) return;

  try {
    const url = `${AI_PREDICTION_URL.replace(/\/$/, '')}/predict?election_id=${encodeURIComponent(electionId)}`;
    const resp = await axios.get(url, { timeout: 10000 });
    const data = resp.data;
    // Emit to the room named by electionId
    // consumers may join room with the raw electionId
    io.to(electionId).emit('prediction:update', data);
    // also emit a generic channel
    io.emit('prediction:update', { electionId, data });
    console.log(`📢 Emitted prediction update for election=${electionId}`);
  } catch (err) {
    console.error('❌ Error fetching predictions from AI service:', err.message || err);
  }
}

async function handleChange(io, change) {
  // fullDocument is available when using updateLookup; fallback to documentKey
  const doc = change.fullDocument || {};
  let electionId = await resolveElectionIdFromDocument(doc);
  if (!electionId) electionId = DEFAULT_ELECTION_ID;
  if (!electionId) {
    // nothing to do
    return;
  }

  const last = lastUpdateByElection.get(electionId) || 0;
  if (now() - last < DEBOUNCE_MS) return;
  lastUpdateByElection.set(electionId, now());
  await fetchAndEmit(io, electionId);
}

export async function initPredictionWatcher(io) {
  if (!io) {
    throw new Error('Socket.IO instance required to init prediction watcher');
  }

  // ensure mongoose is connected; connect if not
  if (!mongoose.connection || mongoose.connection.readyState === 0) {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_voting';
    await mongoose.connect(MONGO_URI, { keepAlive: true });
  }

  const db = mongoose.connection;
  const collectionsToWatch = ['reactions', 'comments', 'posts'];

  collectionsToWatch.forEach((collectionName) => {
    try {
      const cs = db.collection(collectionName).watch([], { fullDocument: 'updateLookup' });
      cs.on('change', async (change) => {
        // lightweight log
        console.debug(`🔄 Change detected in ${collectionName}:`, change.operationType);
        try {
          await handleChange(io, change);
        } catch (err) {
          console.error('Error handling change stream event:', err.message || err);
        }
      });
      cs.on('error', (err) => console.error('ChangeStream error on', collectionName, err));
      streams.push(cs);
    } catch (err) {
      console.warn(`Could not open change stream for collection ${collectionName}:`, err.message || err);
    }
  });

  // graceful cleanup
  const stop = async () => {
    for (const s of streams) {
      try {
        await s.close();
      } catch (e) {
        /* ignore */
      }
    }
    streams = [];
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  console.log('👀 Prediction watcher initialized. Watching:', collectionsToWatch.join(', '));
}

export default initPredictionWatcher;
