#!/usr/bin/env node
// DB diagnostic: check candidates for mock-election
const { MongoClient } = require('mongodb');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/NayaMatDb';
const electionId = process.argv[2] || 'mock-election';

const expected = {
  prapti: 1000,
  astha: 850,
  max: 700,
  lewis: 950,
  rabina: 600,
};

(async function run() {
  console.log('Connecting to MongoDB at', MONGO);
  let client;
  try {
    client = new MongoClient(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const dbName = client.db().databaseName;
    console.log('Connected. Using database:', dbName);

    const db = client.db();
    const col = db.collection('candidates');
    const docs = await col.find({ election_id: electionId }).toArray();

    console.log('\nFound', docs.length, `candidate document(s) for election_id="${electionId}"`);

    if (!docs.length) {
      console.warn('No candidate documents found.');
    }

    // print documents
    console.log('\nDocuments:');
    docs.forEach((d, i) => {
      console.log(`-- [${i}] _id=${d._id} candidate_id=${d.candidate_id || ''} name=${d.name} initialVotes=${d.initialVotes || d.initial_votes || d.initial_vote || 'N/A'}`);
      console.log(JSON.stringify(d, null, 2));
    });

    // checks
    const ids = docs.map(d => String(d._id || d.candidate_id || '')).filter(Boolean);
    const dupIds = ids.filter((v, i, a) => a.indexOf(v) !== i);

    const placeholderNames = docs.filter(d => {
      const n = (d.name || '').toString().toLowerCase();
      return ['alice','bob','carol','david','eve'].includes(n) || /alice|bob|carol/i.test(n);
    }).map(d => ({ id: d._id, name: d.name }));

    const mismatchedVotes = docs.filter(d => {
      const id = String(d._id || d.candidate_id || '').toLowerCase();
      if (!expected.hasOwnProperty(id)) return true; // unexpected id
      const val = Number(d.initialVotes ?? d.initial_votes ?? d.initial_vote ?? d.initial ?? 0);
      return val !== expected[id];
    }).map(d => ({ id: d._id, name: d.name, initialVotes: d.initialVotes ?? d.initial_votes ?? d.initial_vote ?? d.initial }));

    console.log('\nData integrity checks:');
    console.log('- Duplicate IDs:', dupIds.length ? dupIds : 'none');
    console.log('- Placeholder names found:', placeholderNames.length ? placeholderNames : 'none');
    console.log('- Documents with unexpected IDs or mismatched initialVotes:', mismatchedVotes.length ? mismatchedVotes : 'none');

    const ok = (docs.length === 5) && dupIds.length === 0 && placeholderNames.length === 0 && mismatchedVotes.length === 0;
    console.log('\nOverall status:', ok ? 'OK — candidates look good' : 'ISSUES FOUND — see above');

    await client.close();
    process.exit(ok ? 0 : 2);
  } catch (err) {
    console.error('Error during DB check:', err.message || err);
    try { if (client) await client.close(); } catch(e){}
    process.exit(1);
  }
})();
