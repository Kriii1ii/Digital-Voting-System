// backend/server.js
// Third-party Libraries
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const events = require('events');


// Local Imports (Configuration and Database)
const connectDB = require('./config/db.js');

// Events Emitter Configuration
events.defaultMaxListeners = 20; // or 0 for unlimited, but 20 is safer

// Routes (CommonJS requires)
const electionRoutes = require('./routes/election.js');
const resultsRoutes = require('./routes/results.js');
const predictionRoutes = require('./routes/prediction.js');
const predictionsRoutes = require('./routes/predictions.js');
const authRoutes = require('./routes/auth.js');
const candidateRoutes = require('./routes/candidate.js');
const VoterRoutes = require('./routes/voter.js');
const VoteRoutes = require('./routes/vote.js');
// Biometric routes (added during integration)
const biometricRoutes = require('./routes/biometrics.js');
// Post routes for reactions/comments
const postRoutes = require('./routes/postRoutes.js');
const adminRoutes = require('./routes/admin.js');
const contactRoutes = require("./routes/contact.js");
const userRoutes = require("./routes/users.js");
dotenv.config();

// Initialize app and connect DB
const app = express();
connectDB();
// Middleware
app.use(express.json({ limit: '10mb' }));

// ✅ CORS configuration: allow localhost:3000, 5173, 5174 and handle preflight properly
// CORS configuration
const FRONTEND_URLS = (process.env.FRONTEND_ORIGINS ||
  'http://localhost:3000,http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(url => url.trim().replace(/\/$/, '')); // remove trailing slash

app.use(
  cors({
    origin: function (origin, callback) {
      // allow apps like curl or server-to-server
      if (!origin) {
        console.debug('[CORS] No origin (curl/server-to-server), allowing');
        return callback(null, true);
      }

      const cleanedOrigin = origin.replace(/\/$/, '');
      console.debug('[CORS] Checking origin:', { origin, cleaned: cleanedOrigin, allowed: FRONTEND_URLS });

      if (FRONTEND_URLS.includes(cleanedOrigin)) {
        console.debug('[CORS] ✅ Origin allowed:', cleanedOrigin);
        return callback(null, true);
      }

      // handle single env FRONTEND_URL
      if (process.env.FRONTEND_URL &&
          cleanedOrigin === process.env.FRONTEND_URL.replace(/\/$/, '')) {
        console.debug('[CORS] ✅ Origin allowed (env FRONTEND_URL):', cleanedOrigin);
        return callback(null, true);
      }

      console.warn("❌ CORS BLOCKED ORIGIN:", origin, "Allowed:", FRONTEND_URLS);
      return callback(new Error("Not allowed by CORS"));
    },

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

// Explicitly handle OPTIONS for all routes


app.use(helmet());
app.use(morgan('dev'));

// Rate limiter - relaxed for development with localhost bypass
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Relaxed for development (quality-check polling needs this)
  message: 'Too many requests from this IP, try again later.',
  skip: (req, res) => {
    // Skip rate limiting for localhost
    const ip = req.ip || req.connection.remoteAddress || '';
    const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || 
           ip.includes('127.0.0.1') || ip.includes('localhost') ||
           ip.includes('::ffff:127.0.0.1');
    
    // ✅ IMPORTANT: Always skip rate limiting for CORS preflight OPTIONS requests
    const isOptions = req.method === 'OPTIONS';
    
    return isLocalhost || isOptions;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Basic routes
app.get('/', (req, res) =>
  res.status(200).send('Real-Time Digital Voting System Backend Running')
);

app.get('/api/health', (req, res) =>
  res.status(200).json({ status: 'OK', message: 'Backend is healthy' })
);

// // Example in Express
// app.get("/api/posts", (req, res) => {
//   res.send(posts); // if this exists
// });

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/voters', VoterRoutes);
app.use('/api/votes', VoteRoutes);
// Biometric API mount
app.use('/api/biometrics', biometricRoutes);
// Post API (reactions/comments)
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/users", userRoutes);
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
// Prefer an env override for PORT to avoid local service conflicts
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

// expose io on the express app for controllers to emit events without circular imports
app.set('io', io);

// initialize prediction watcher to emit updates on DB changes
const initPredictionWatcher = require('./realtime/predictionWatcher.js');
try {
  // initPredictionWatcher may return a promise
  initPredictionWatcher(io).catch?.((err) => console.error('Prediction watcher failed to start:', err));
} catch (err) {
  console.error('Could not initialize prediction watcher:', err);
}
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
  console.log(`Server running on http://localhost:${PORT}`)
);
