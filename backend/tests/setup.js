// Jest setup file
// Mock environment variables if needed
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test_digital_voting';

