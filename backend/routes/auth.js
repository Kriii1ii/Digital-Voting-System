const express = require("express");
const axios = require('axios');
const generateToken = require("../utils/generateToken.js");
const User = require("../models/User.js");
const Voter = require("../models/Voter.js");
const Candidate = require("../models/Candidate.js")
const { protect } = require("../middleware/authMiddleware.js");
const { roleMiddleware } = require("../middleware/roleMiddleware.js");
const bcrypt = require('bcrypt')

const router = express.Router();

const BIOMETRIC_SERVICE_URL = process.env.BIOMETRIC_SERVICE_URL || 'http://localhost:8000';
const BIOMETRIC_CHECK_TIMEOUT = parseInt(process.env.BIOMETRIC_CHECK_TIMEOUT_MS, 10) || 5000;

/**
 * @route   POST /api/auth/register
 * @desc    Register user (pending until committee verifies)
 * @body    { email, password, fullName, voterId|voterid, idNumber, dateOfBirth, phone, idType, province, district, ward, role }
 */
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      voterId: voterIdFromBody,
      idNumber,
      dateOfBirth,
      phone,
      idType,
      province,
      district,
      ward,
      role: roleFromBody,
    } = req.body;

    // normalize fields
    const voterIdRaw = voterIdFromBody || req.body.voterid || "";
    const emailNorm = String(email || "").toLowerCase().trim();
    const voterIdNorm = String(voterIdRaw || "").trim();
    const idNumberNorm = String(idNumber || "").trim();

    if (!emailNorm || !password || !fullName || !voterIdNorm) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // DEBUG: show normalized inputs
    console.debug('[auth.register] normalized inputs', { emailNorm, voterIdNorm, idNumberNorm });

    // Find registry entry (prefer voterId, fallback to nationalId)
    const registry = await Voter.findOne({
      $or: [{ voterId: voterIdNorm }, { nationalId: idNumberNorm }],
    });
    console.debug('[auth.register] registry lookup result', { registryFound: !!registry, registryId: registry?._id });

    if (!registry) {
      return res.status(400).json({
        success: false,
        message: "Voter not found in the official registry",
      });
    }

    if (registry.hasRegistered) {
      return res.status(400).json({
        success: false,
        message: "This Voter ID is already registered.",
      });
    }

    // Ensure biometric enrollment exists for this voterId before allowing registration
    try {
      const resp = await axios.get(`${BIOMETRIC_SERVICE_URL}/api/biometrics/face/exists/${encodeURIComponent(voterIdNorm)}`, {
        timeout: BIOMETRIC_CHECK_TIMEOUT,
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (!resp || typeof resp.data === 'undefined') {
        return res.status(502).json({ success: false, message: 'Unable to verify biometric enrollment (no response from biometric service)' });
      }

      if (!resp.data.exists) {
        return res.status(400).json({ success: false, message: 'Face validation required before registration. Please complete face verification first.' });
      }
    } catch (err) {
      console.error('Biometric check failed during registration:', err.message || err);
      return res.status(502).json({ success: false, message: 'Failed to verify biometric enrollment. Try again later.' });
    }

    // Prevent duplicate user in users collection
    const userExists = await User.findOne({
      $or: [
        { email: emailNorm },
        { voterId: voterIdNorm },
        { idNumber: idNumberNorm },
      ],
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email, voter ID, or ID number",
      });
    }

    const allowedRoles = ["voter", "candidate", "admin", "electoral_committee"];
    const role = allowedRoles.includes(roleFromBody)
      ? roleFromBody
      : "voter";

    const userData = {
      role,
      fullName: fullName.trim(),
      dateOfBirth,
      phone: String(phone || "").trim(),
      email: emailNorm,
      password,
      idType,
      idNumber: idNumberNorm,
      voterId: voterIdNorm,
      province,
      district,
      ward,
      isVerified: role === "candidate" ? false : true, // voter auto-verified, candidate needs committee
    };

    const user = await User.create(userData);

    // mark registry as registered
    registry.hasRegistered = true;
    await registry.save();

    return res.status(201).json({
      success: true,
      message:
        role === "candidate"
          ? "Candidate registration received. Await Electoral Committee verification."
          : "Registration successful.",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
      },
    });
  } catch (err) {
    if (err && err.code === 11000) {
      const dupField = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `Duplicate value for ${dupField}`,
        data: err.message,
      });
    }
    console.error("Registration Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server Error" });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (only if verified)
 * @body    { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "").toLowerCase().trim();
    const { password } = req.body;

    const user = await User.findOne({ email: emailNorm }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          req.t?.("auth.invalid_credentials") ||
          "Invalid email or password",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          req.t?.("auth.invalid_credentials") ||
          "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          req.t?.("auth.pending_verification") ||
          "Your account is pending verification by the Electoral Committee",
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: req.t?.("auth.login_success"),
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        voterId: user.voterId,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
        idType: user.idType,
        district: user.district,
        idNumber: user.idNumber,
        province: user.province,
        ward: user.ward,
        bio: user.bio,
        profilePicture: user.profilePicture,
        token,
      },
    });
  } catch (err) {
    console.error("LOGIN error:", err);
    return res.status(500).json({
      success: false,
      message: req.t?.("common.server_error") || "Server Error",
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user (only if verified)
 * @body    { email, password }
 */
router.post("/loginCandidate", async (req, res) => {
  try {
    const emailNorm = String(req.body.email || "").toLowerCase().trim();
    const { password } = req.body;

    const user = await Candidate.findOne({ email: emailNorm }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          req.t?.("auth.invalid_credentials") ||
          "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          req.t?.("auth.invalid_credentials") ||
          "Invalid email or password",
      });
    }

    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message:
          req.t?.("auth.pending_verification") ||
          "Your account is pending verification by the Electoral Committee",
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: req.t?.("auth.login_success"),
      data: {
        id:user._id,
        fullName:user.fullName,
        email:user.email,
        partyName:user.partyName,
        manifesto:user.manifesto,
        age: user.age,
        gender: user.gender,
        position:user.position,
        photo:user.photo,
        politicalSign:user.politicalSign,
        totalVotes:user.totalVotes,
        createdBy:user.createdBy,
        token,
      },
    });
  } catch (err) {
    console.error("LOGIN error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * @route   PATCH /api/auth/verify/:id
 * @desc    Verify a pending candidate or user (Committee/Admin only)
 * @access  Protected
 */
router.patch(
  "/verify/:id",
  protect,
  roleMiddleware(["admin", "committee"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user)
        return res.status(404).json({ success: false, message: "User not found" });

      // mark as verified
      user.isVerified = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: `${user.fullName} has been verified successfully.`,
        data: {
          id: user._id,
          fullName: user.fullName,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({
        success: false,
        message: "Server Error during verification",
      });
    }
  }
);

module.exports = router;
