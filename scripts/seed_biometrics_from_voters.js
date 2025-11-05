const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { randomUUID } = require('crypto');
dotenv.config();

const User = require('../backend/models/User');
const Biometric = require('../backend/models/Biometric');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/NayaMatDb';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to', MONGO_URI);

    // Read some voters to map names
    const votersColl = mongoose.connection.db.collection('voters');
    const voters = await votersColl.find({}).limit(10).toArray();
    if (!voters || voters.length === 0) {
      console.log('No voters found to base users on. Exiting.');
      return process.exit(0);
    }

    const created = [];
    for (let i = 0; i < Math.min(5, voters.length); i++) {
      const v = voters[i];
      // create a simple user record
      const email = `${(v.voterId || 'user').toLowerCase()}@example.test`;
      const phone = `98${String(Math.floor(10000000 + Math.random()*90000000))}`;
      const userObj = new User({
        role: 'voter',
        fullName: v.fullName || `Voter ${i+1}`,
        dateOfBirth: v.dateOfBirth || '1990-01-01',
        phone,
        email,
        password: 'Password123!',
        idType: 'national',
        idNumber: v.nationalId || '0000000',
        voterId: v.voterId || `V-${i+1}`,
        province: 'TestProvince',
        district: 'TestDistrict',
        ward: 1,
        isVerified: true,
        biometricRegistered: true,
        biometricType: 'face',
        biometricRegistrationDate: new Date()
      });

      const saved = await userObj.save();

      // create a biometric doc for the user
      const templateId = randomUUID();
      await Biometric.findOneAndUpdate({ userId: saved._id }, {
        $set: {
          userId: saved._id,
          faceRegistered: true,
          faceTemplateId: templateId,
          registrationDate: new Date(),
          faceImageSample: null
        },
        $push: { faceTemplateIds: templateId }
      }, { upsert: true });

      created.push({ userId: saved._id.toString(), voterId: saved.voterId });
      console.log('Created user & biometric for', saved.voterId || saved._id.toString());
    }

    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    const bioCount = await mongoose.connection.db.collection('biometrics').countDocuments();
    console.log('Now counts -> users:', userCount, 'biometrics:', bioCount);

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Seeder error', e);
    process.exit(1);
  }
}

run();
