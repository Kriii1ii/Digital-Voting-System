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
// Simplified CORS middleware: whitelist specific origins and allow credentials.
const allowedOrigins = [
  "https://digitalvotingsystem9.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    // Log blocked origins so you can see them in Render logs
    console.warn("CORS BLOCKED:", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
      console.warn("CORS BLOCKED ORIGIN:", origin, "Allowed:", FRONTEND_URLS);
      return callback(new Error("Not allowed by CORS"));
    },


    methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
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
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/voters', VoterRoutes);
app.use('/api/votes', VoteRoutes);
// Biometric API mount
app.use('/api/biometrics', biometricRoutes);
// Post API (reactions/comments)
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/users", userRoutes);
// Admin repair and system status endpoints
app.use('/api/admin-repair', require('./routes/adminRepair'));
app.use('/api/status', require('./routes/status'));
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
    origin: function (origin, callback) {
      // allow server-to-server calls
      if (!origin) return callback(null, true);
      const cleaned = origin.replace(/\/$/, '');
      if (FRONTEND_URLS.includes(cleaned) || (process.env.FRONTEND_URL && cleaned === process.env.FRONTEND_URL.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

// expose io on the express app for controllers to emit events without circular imports
app.set('io', io);

// initialize prediction watcher to emit updates on DB changes
// initialize prediction watcher (DISABLED IN PRODUCTION)
const initPredictionWatcher = require('./realtime/predictionWatcher.js');

if (process.env.NODE_ENV !== "production") {
  try {
    initPredictionWatcher(io).catch?.((err) =>
      console.error('Prediction watcher failed to start:', err)
    );
  } catch (err) {
    console.error('Could not initialize prediction watcher:', err);
  }
} else {
  console.log("🚫 Prediction watcher disabled in production (MongoDB free tier)");
}


// Start mock votes (DISABLED IN PRODUCTION)
try {
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCK_VOTES !== 'false') {
    const initMockVotes = require('./realtime/mockVotes.js');
    initMockVotes(io).catch?.((err) =>
      console.error('Mock votes failed to start:', err)
    );
  } else {
    console.log("🚫 Mock votes disabled in production");
  }
} catch (err) {
  console.error('Could not initialize mock votes:', err);
}

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id, 'from', socket.handshake.address);

  // Join a prediction room. Supports legacy 'joinElection' and new 'joinPrediction'
  socket.on('joinPrediction', (electionId) => {
    try {
      const room = `prediction:${electionId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    } catch (e) {
      console.warn('joinPrediction error', e?.message || e);
    }
  });

  socket.on('joinElection', (electionId) => {
    // legacy support: map to prediction:<id>
    try {
      const room = `prediction:${electionId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined legacy room ${room}`);
    } catch (e) {
      console.warn('joinElection error', e?.message || e);
    }
  });

  socket.on('leavePrediction', (electionId) => {
    try {
      const room = `prediction:${electionId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    } catch (e) {
      console.warn('leavePrediction error', e?.message || e);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', socket.id, 'reason:', reason);
  });
});

// Start server
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
