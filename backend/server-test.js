import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import biometricRoutes from './routes/biometrics.js';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: 'http://localhost:5173',
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

// Routes - only biometrics for testing
app.use('/api/biometrics', biometricRoutes);

// Health checks
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is healthy (TEST MODE - No DB)' });
});

app.get('/api/biometrics/health', async (req, res) => {
  try {
    const axios = (await import('axios')).default;
    const biometricHealth = await axios.get(
      'http://localhost:8000/api/health',
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
      error: error.message
    });
  }
});

// Default route
app.get('/', (req, res) => {
  res.status(200).send('Digital Voting System Backend (TEST MODE - No DB)');
});

// 404 handler
app.use((req, res, next) => {
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

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT} (No Database)`);
  console.log(`💡 Biometric service: http://localhost:8000`);
  console.log(`📊 Ready for integration testing!`);
});
