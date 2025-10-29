import express from "express";
import {
  createElection,
  getElections,
  getElectionById,
  endElection,
} from "../controllers/electionController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { roleMiddleware } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create new election — only admin
router.post("/create", protect, roleMiddleware(["admin"]), createElection);

// Get all elections — public
router.get("/", getElections);

// Get one election by ID — public
router.get("/:id", getElectionById);

// End an election — only admin
router.put("/:id/end", protect, roleMiddleware(["admin"]), endElection);

export default router;
