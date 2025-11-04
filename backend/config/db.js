// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use environment variable if provided, otherwise fall back to a local DB for dev
  // Follow INTEGRATE.md requirement: default DB name `digitalvoting` (no underscore)
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/digitalvoting';

    if (!process.env.MONGO_URI) {
      console.warn(
        'Warning: MONGO_URI not set in environment. Using fallback local MongoDB URI. Update backend/.env with your production/atlas URI.'
      );
    }

    // Modern mongoose uses sensible defaults; passing legacy options is unnecessary and may cause warnings
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Add runtime listeners to surface connection issues without relying only on thrown exceptions
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports= connectDB;
