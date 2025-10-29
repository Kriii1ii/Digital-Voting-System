// backend/server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

// Routes
import authRoutes from './routes/auth.js';
import candidateRoutes from './routes/candidate.js';
import electionRoutes from './routes/election.js';
import resultsRoutes from './routes/results.js';
import predictionRoutes from './routes/prediction.js';

dotenv.config();

// Initialize app and connect DB
const app = express();
connectDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(
  cors({
    origin: 'http://localhost:5173', // your frontend
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));

// Rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, try again later.',
  })
);

// Basic routes
app.get('/', (req, res) =>
  res.status(200).send('🚀 Real-Time Digital Voting System Backend Running')
);

app.get('/api/health', (req, res) =>
  res.status(200).json({ status: 'OK', message: 'Backend is healthy' })
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/election', electionRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/prediction', predictionRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

// Create server and attach socket.io
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinElection', (electionId) => {
    socket.join(electionId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
