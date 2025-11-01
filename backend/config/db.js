import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // If no MONGO_URI provided, start an in-memory MongoDB for local development
    if (!mongoUri) {
      console.warn('MONGO_URI not set — starting in-memory MongoDB for development');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
    }

    const conn = await mongoose.connect(mongoUri, {
      // these options are no-ops for modern drivers but kept for compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB Connection Failed:', err.message);
    // If a MONGO_URI was set but connection failed (common when a local mongod isn't running),
    // fall back to an in-memory MongoDB so local development can continue.
    try {
      console.warn('Attempting fallback to in-memory MongoDB for development');
      const mongod = await MongoMemoryServer.create();
      const fallbackUri = mongod.getUri();
      const conn2 = await mongoose.connect(fallbackUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log(`MongoDB Connected (in-memory): ${conn2.connection.host}`);
      return;
    } catch (fallbackErr) {
      console.error('In-memory MongoDB fallback failed:', fallbackErr.message);
      throw err; // rethrow original error for visibility
    }
  }
};

export default connectDB;
