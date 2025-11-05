const express = require('express');
const biometricController = require('../controllers/biometricController.js');
const rateLimit = require('express-rate-limit');
// middleware exports a named `protect` function — import it and alias to `auth` for routes
const { protect: auth } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Rate limiter for face quality checks to protect the biometric microservice
const faceQualityLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 10, // limit each IP to 10 requests per windowMs
	message: {
		error: 'Too many face quality check requests, please try again later.',
		retryAfter: 60
	},
	standardHeaders: true,
	legacyHeaders: false,
});

// Biometric registration and verification routes
router.post('/register', auth, biometricController.registerBiometrics);
router.post('/verify', biometricController.verifyBiometrics);
router.get('/status/:userId', auth, biometricController.getBiometricStatus);

// Face recognition endpoints
router.post('/face/validate', biometricController.validateFace);
router.post('/face/quality-check', faceQualityLimiter, biometricController.strictQualityCheck);
// Allow unauthenticated registration endpoints so new users can register biometric templates
// during account creation (these endpoints perform their own userId checks).
router.post('/face/register', biometricController.registerFace);
router.post('/face/register-batch', biometricController.registerFaceBatch);
router.post('/face/verify', auth, biometricController.verifyFace);

// Fingerprint endpoints removed — application is face-only now

module.exports = router;
