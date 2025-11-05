const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const { randomUUID } = require('crypto');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/NayaMatDb';

(async function(){
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    console.log('Connected to', MONGO_URI);

    const voters = await db.collection('voters').find({}).limit(10).toArray();
    if (!voters || voters.length === 0) {
      console.log('No voters available to base users on');
      return process.exit(0);
    }

    const toCreate = Math.min(5, voters.length);
    const created = [];
    for (let i = 0; i < toCreate; i++) {
      const v = voters[i];
      const userDoc = {
        role: 'voter',
        fullName: v.fullName || `Voter ${i+1}`,
        dateOfBirth: v.dateOfBirth || '1990-01-01',
        phone: `98${String(Math.floor(10000000 + Math.random()*90000000))}`,
        email: `${(v.voterId||'user') .toLowerCase()}@example.test`,
        password: '$2a$10$placeholderhashedpassword',
        idType: 'national',
        idNumber: v.nationalId || '0000000',
        voterId: v.voterId || `V-${i+1}`,
        province: 'TestProvince',
        district: 'TestDistrict',
        ward: 1,
        isVerified: true,
        biometricRegistered: true,
        biometricType: 'face',
        biometricRegistrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const res = await db.collection('users').insertOne(userDoc);
      const userId = res.insertedId;

      const templateId = randomUUID();
      await db.collection('biometrics').insertOne({
        userId: userId,
        faceRegistered: true,
        faceTemplateId: templateId,
        faceTemplateIds: [templateId],
        registrationDate: new Date(),
        provider: 'local'
      });

      created.push({ userId: userId.toString(), voterId: userDoc.voterId });
      console.log('created user & biometric for', userDoc.voterId);
    }

    const userCount = await db.collection('users').countDocuments();
    const bioCount = await db.collection('biometrics').countDocuments();
    console.log('Done. Counts -> users:', userCount, 'biometrics:', bioCount);

    process.exit(0);
  } catch (e) {
    console.error('error', e);
    process.exit(1);
  } finally {
    try { await client.close(); } catch(e){}
  }
})();
