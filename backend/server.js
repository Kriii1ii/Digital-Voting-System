import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import biometricRoutes from './routes/biometrics.js'; 

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, try again later.'
});
app.use(limiter);

// Default route
app.get('/', (req, res) => {
  res.status(200).send('Real-Time Digital Voting System Backend Running 🚀');
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is healthy' });
});

// Biometric service health check
app.get('/api/biometrics/health', async (req, res) => {
  try {
    const axios = (await import('axios')).default;
    const biometricHealth = await axios.get(
      `${process.env.BIOMETRIC_SERVICE_URL || 'http://localhost:8000'}/api/health`,
      { timeout: 5000 }
    );
    res.json({
      backend: 'OK',
      biometric_service: biometricHealth.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      backend: 'OK',
      biometric_service: 'UNREACHABLE',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/biometrics', biometricRoutes); // ADD THIS ROUTE

// 404 handler
app.use( (req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Biometric service: ${process.env.BIOMETRIC_SERVICE_URL || 'http://localhost:8000'}`);
});