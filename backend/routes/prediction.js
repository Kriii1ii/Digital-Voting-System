import express from "express";
import { predictWinner } from "../controllers/predictionController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin triggers AI prediction
router.get("/:electionId", protect, adminOnly, predictWinner);

export default router;
