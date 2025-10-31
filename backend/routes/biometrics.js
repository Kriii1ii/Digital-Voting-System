import express from 'express';
import biometricController from '../controllers/biometricController.js';
import { auth } from '../middleware/authMiddleware.js'; // Updated import path

const router = express.Router();

// Biometric registration and verification routes
router.post('/register', auth, biometricController.registerBiometrics);
router.post('/verify', biometricController.verifyBiometrics);
router.get('/status/:userId', auth, biometricController.getBiometricStatus);

// Face recognition endpoints
router.post('/face/validate', biometricController.validateFace);
router.post('/face/quality-check', biometricController.strictQualityCheck);
router.post('/face/register', auth, biometricController.registerFace);
router.post('/face/register-batch', auth, biometricController.registerFaceBatch);
router.post('/face/verify', auth, biometricController.verifyFace);

// Fingerprint endpoints removed — application is face-only now

export default router;