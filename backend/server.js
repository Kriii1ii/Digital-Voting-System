const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const dotenv = require("dotenv");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const events = require("events");

dotenv.config();

// Local Imports
const connectDB = require("./config/db.js");

// Route Imports
const electionRoutes = require("./routes/election.js");
const resultsRoutes = require("./routes/results.js");
const predictionRoutes = require("./routes/prediction.js");
const authRoutes = require("./routes/auth.js");
const candidateRoutes = require("./routes/candidate.js");
const VoterRoutes = require("./routes/voter.js");
const VoteRoutes = require("./routes/vote.js");
const biometricRoutes = require("./routes/biometrics.js");
const postRoutes = require("./routes/postRoutes.js");
const adminRoutes = require("./routes/admin.js");
const contactRoutes = require("./routes/contact.js");
const userRoutes = require("./routes/users.js");
const predictionsApiRoutes = require("./routes/predictions.js");
const adminRepairRoutes = require("./routes/adminRepair.js");
const statusRoutes = require("./routes/status.js");

// Event listener safety
events.defaultMaxListeners = 20;

// Initialize app
const app = express();

// Connect database
connectDB();

// JSON parser
app.use(express.json({ limit: "10mb" }));

// ======================================================
// ✅ CORS: whitelist + optional env override + Vercel preview allow
// ======================================================
// Default allowed origins (include your primary Vercel URL)
const DEFAULT_ALLOWED_ORIGINS = [
  "https://digitalvotingsystem9.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
];

// Allow adding more origins via environment variable (comma separated)
const envOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((o) => o && o.trim())
  .filter(Boolean);

// Build the final allowed origins list (unique)
const allowedOrigins = Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]));

function isAllowedOrigin(origin) {
  if (!origin) return false;
  // Allow any Vercel subdomain (preview deployments) to avoid accidental blocking
  if (origin.endsWith(".vercel.app")) return true;
  return allowedOrigins.includes(origin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Quietly ignore requests without an Origin (server-to-server / health checks)
    if (origin) console.warn("CORS BLOCKED:", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ======================================================
// SECURITY + LOGGING
// ======================================================
app.use(helmet());
app.use(morgan("dev"));

// ======================================================
// RATE LIMITER
// ======================================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: (req) => {
    const ip = req.ip || "";
    const isLocal =
      ip.includes("127.0.0.1") ||
      ip.includes("localhost") ||
      ip === "::1";
    return req.method === "OPTIONS" || isLocal;
  },
});

app.use(globalLimiter);

// ======================================================
// BASIC ROUTES
// ======================================================
app.get("/", (req, res) =>
  res.status(200).send("Real-Time Digital Voting System Backend Running")
);

app.get("/api/health", (req, res) =>
  res.status(200).json({ status: "OK", message: "Backend is healthy" })
);

// ======================================================
// API ROUTES
// ======================================================
app.use("/api/auth", authRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/predictions", predictionsApiRoutes);
app.use("/api/voters", VoterRoutes);
app.use("/api/votes", VoteRoutes);
app.use("/api/biometrics", biometricRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin-repair", adminRepairRoutes);
app.use("/api/status", statusRoutes);

// 404 Handler
app.use((req, res) =>
  res.status(404).json({ message: "Route not found" })
);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

// ======================================================
// SERVER + SOCKET.IO
// ======================================================
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Clean Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // allow server-to-server or non-browser requests
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      console.warn('Socket.IO CORS BLOCKED:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

// Expose Socket.IO to controllers
app.set("io", io);

// ======================================================
// DISABLE WATCHERS IN PRODUCTION
// ======================================================
const initPredictionWatcher = require("./realtime/predictionWatcher.js");

if (process.env.NODE_ENV !== "production") {
  try {
    initPredictionWatcher(io).catch((err) =>
      console.error("Prediction watcher failed:", err)
    );
  } catch (err) {
    console.error("Prediction watcher init error:", err);
  }
} else {
  console.log("🚫 Prediction watcher disabled in production");
}

// Mock votes
if (process.env.NODE_ENV !== "production") {
  try {
    const initMockVotes = require("./realtime/mockVotes.js");
    initMockVotes(io).catch((err) =>
      console.error("Mock votes failed:", err)
    );
  } catch (err) {
    console.error("Mock Votes Init Error:", err);
  }
} else {
  console.log("🚫 Mock votes disabled in production");
}

// ======================================================
// SOCKET.IO EVENTS
// ======================================================
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinPrediction", (electionId) => {
    const room = `prediction:${electionId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined ${room}`);
  });

  socket.on("leavePrediction", (electionId) => {
    const room = `prediction:${electionId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ======================================================
// START SERVER
// ======================================================
// Bind to 0.0.0.0 in container environments to accept external connections
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  const addr = server.address() || {};
  const boundAddress = (addr.address === '::' || addr.address === '0.0.0.0') ? '0.0.0.0' : addr.address || HOST;
  const boundPort = addr.port || PORT;
  console.log(`🚀 Server listening on http://${boundAddress}:${boundPort}`);
  console.log(`🔒 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});
