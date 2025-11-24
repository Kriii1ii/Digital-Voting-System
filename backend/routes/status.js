const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');

router.get('/system-status', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbOk = dbState === 1;
    const aiUrl = process.env.AI_PREDICTION_URL || 'http://localhost:8000/health';
    let aiOk = false;
    try {
      const resp = await axios.get(aiUrl, { timeout: 3000 });
      aiOk = resp.status === 200;
    } catch (e) {
      aiOk = false;
    }

    // change stream available heuristic: replicaSet configured?
    const mongoUri = process.env.MONGO_URI || '';
    const hasReplica = /replicaSet=/i.test(mongoUri) || !!process.env.MONGO_REPLICA;

    return res.json({ ok: true, dbOk, aiOk, changeStreamsAvailable: hasReplica });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || err });
  }
});

module.exports = router;
