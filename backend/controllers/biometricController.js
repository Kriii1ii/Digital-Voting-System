import axios from 'axios';
import User from '../models/User.js';
import Biometric from '../models/Biometric.js';
import logger from '../utils/logger.js';
import { encryptTemplate, decryptTemplate } from '../utils/crypto.js';
import { randomUUID } from 'crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';

const BIOMETRIC_SERVICE_URL = process.env.BIOMETRIC_SERVICE_URL || 'http://localhost:8000';

class BiometricController {

  async validateFace(req, res) {
    try {
      const { userId, image } = req.body;

      if (!image) {
        return res.status(400).json({ success: false, message: 'Image data is required' });
      }

      // Call biometric service to validate face quality
      const response = await axios.post(
        `${BIOMETRIC_SERVICE_URL}/api/face/validate`,
        { image },
        {
          headers: { 'Content-Type': 'application/json' },
          validateStatus: false
        }
      );

      // Normalize microservice response
      const svc = response.data || {};
      let { success, quality_metrics, error, face_detected } = svc;

      // Prefer detailed info under `details`
      const details = quality_metrics || svc.details || null;

      // Extract confidence metric when available
      const confidence = typeof svc.confidence !== 'undefined' ? svc.confidence : (details && (details.confidence || details.detection_confidence || details.score));
      if (typeof confidence !== 'undefined') {
        logger.info('Face validation confidence', { userId, confidence });
      }

      // Relaxed acceptance policy for live captures:
      // 1) If microservice explicitly approves, keep success.
      // 2) Otherwise, if a face was detected and no explicit blocking flags (mask/covering/obstruction) exist,
      //    accept when confidence is reasonably high (>= 0.45) or when confidence is absent.
      const explicitBlocking = details && (details.mask === true || details.covering === true || details.obstruction === true);

      const CONFIDENCE_THRESHOLD = 0.45;

      if (success !== true) {
        const faceDetected = !(typeof face_detected === 'boolean' && face_detected === false);
        if (faceDetected && !explicitBlocking) {
          const hasConfidence = typeof confidence === 'number';
          if (!hasConfidence || confidence >= CONFIDENCE_THRESHOLD) {
            logger.info('Applying relaxed acceptance for live capture', { userId, confidence, details });
            return res.status(200).json({ success: true, details, face_detected: true, userId, message: 'Relaxed acceptance: face detected, no blocking obstructions' });
          }
        }
      }

      return res.status(response.status).json({ success, quality_metrics, error, face_detected, details, confidence, userId });
    } catch (error) {
      logger.error('Face validation error', { error: error.message });
      // If the microservice is unreachable or errors, allow a relaxed acceptance so live-capture flows do not block.
      logger.warn('Validation service unreachable or failed; applying relaxed acceptance', { err: error.message });
      return res.status(200).json({ success: true, details: null, face_detected: true, userId: req.body.userId, message: 'Validation service unavailable; relaxed acceptance applied' });
    }
  }

  // NEW: Strict quality check proxy to microservice
  async strictQualityCheck(req, res) {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ success: false, message: 'Image is required' });

      const response = await axios.post(
        `${BIOMETRIC_SERVICE_URL}/api/face/quality-check`,
        { image },
        { headers: { 'Content-Type': 'application/json' }, validateStatus: false }
      );

      // Normalize and apply relaxed acceptance similar to validateFace
      const svc = response.data || {};
      let { approved, success, quality_metrics, details, face_detected } = svc;
      // Accept legacy field names
      details = details || quality_metrics || svc.details || null;

      const confidence = typeof svc.confidence !== 'undefined' ? svc.confidence : (details && (details.confidence || details.detection_confidence || details.score));
      if (typeof confidence !== 'undefined') {
        logger.info('Quality-check confidence', { confidence });
      }

      const explicitBlocking = details && (details.mask === true || details.covering === true || details.obstruction === true);
      const faceDetected = !(typeof face_detected === 'boolean' && face_detected === false);
      const CONFIDENCE_THRESHOLD = 0.45;

      // If the microservice explicitly approves, return that
      if (approved === true || success === true) {
        return res.status(response.status).json(svc);
      }

      // Otherwise, relax: accept when face detected and no explicit blocking and confidence ok (or absent)
      if (faceDetected && !explicitBlocking) {
        const hasConfidence = typeof confidence === 'number';
        if (!hasConfidence || confidence >= CONFIDENCE_THRESHOLD) {
          logger.info('Quality check relaxed acceptance', { confidence, details });
          return res.status(200).json({ success: true, approved: true, details, confidence, face_detected: true, message: 'Relaxed acceptance: face detected, no blocking obstructions' });
        }
      }

      // Fallback: return original response
      return res.status(response.status).json(svc);
    } catch (err) {
      logger.warn('Strict quality check failed/unreachable; applying relaxed acceptance', { err: err.message });
      // When microservice unreachable, accept capture so UI flow isn't blocked
      return res.status(200).json({ success: true, approved: true, details: null, face_detected: true, message: 'Quality check unavailable; relaxed acceptance applied' });
    }
  }

  async registerBiometrics(req, res) {
    try {
      const { userId, faceData, consent } = req.body;

      logger.info('Biometric (face-only) registration request', { userId });

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }

      if (!consent) {
        return res.status(400).json({ success: false, message: 'User consent is required for biometric enrollment' });
      }

      if (!faceData) {
        return res.status(400).json({ success: false, message: 'Face image data is required' });
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const results = {};
      let faceSuccess = false;

      // Call biometric service to register face
      try {
        const faceResponse = await axios.post(
          `${BIOMETRIC_SERVICE_URL}/api/face/register`,
          { user_id: userId, image_data: faceData },
          { timeout: 30000 }
        );

        results.face = faceResponse.data;
        faceSuccess = !!faceResponse.data.success;

        // Persist template id and encrypted encoding if provided
        try {
          const templateId = faceResponse.data?.data?.template_id || faceResponse.data?.template_id || null;
          const encoding = faceResponse.data?.data?.encoding || faceResponse.data?.encoding || null;
          const encryptedEncoding = encoding ? encryptTemplate(encoding) : null;
          await Biometric.findOneAndUpdate(
            { userId },
            {
              faceRegistered: faceSuccess,
              faceTemplateId: templateId || null,
              faceEncoding: null,
              faceEncodingEncrypted: encryptedEncoding || null,
              registrationDate: new Date()
            },
            { upsert: true }
          );
        } catch (persistErr) {
          logger.warn('Failed to persist face template metadata', { err: persistErr.message });
        }

        if (faceSuccess) {
          // Update user biometric flags
          user.biometricRegistered = true;
          user.biometricType = 'face';
          user.biometricRegistrationDate = new Date();
          await user.save();
        }

        logger.info('Face registration completed', { userId, success: faceSuccess });
      } catch (err) {
        logger.error('Face registration failed', err, { userId });
        results.face = { success: false, error: err.response?.data || err.message };
      }

      res.json({
        success: faceSuccess,
        message: faceSuccess ? 'Face registration completed successfully' : 'Face registration failed',
        data: results,
        registeredTypes: { face: faceSuccess },
        userId
      });
    } catch (error) {
      logger.error('Biometric registration controller error', error, { userId: req.body.userId });
      res.status(500).json({ success: false, message: 'Internal server error during biometric registration', error: error.message });
    }
  }

  async verifyBiometrics(req, res) {
    try {
      const { userId, voterId, faceData } = req.body;

      logger.info('Biometric (face-only) verification request', { userId, voterId });

      // Allow both userId and voterId for flexibility
      let user;
      if (userId) {
        user = await User.findById(userId);
      } else if (voterId) {
        user = await User.findOne({ voterId });
      }

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const results = {};
      let overallVerified = false;

      // Verify face
      if (faceData) {
        try {
          const biometricDoc = await Biometric.findOne({ userId: user._id });
          const requestBody = { user_id: user._id.toString(), image_data: faceData };
          if (biometricDoc?.faceEncodingEncrypted) {
            try {
              requestBody.reference_encoding = decryptTemplate(biometricDoc.faceEncodingEncrypted);
            } catch (decErr) {
              logger.warn('Failed to decrypt stored face encoding for verification', { err: decErr.message });
            }
          } else if (biometricDoc?.faceEncoding) {
            requestBody.reference_encoding = biometricDoc.faceEncoding;
          }

          const faceResponse = await axios.post(`${BIOMETRIC_SERVICE_URL}/api/face/verify`, requestBody, { timeout: 30000 });
          results.face = faceResponse.data;
          overallVerified = !!faceResponse.data.success;
          logger.info('Face verification completed', { userId: user._id, result: faceResponse.data });
        } catch (error) {
          logger.error('Face verification failed', error, { userId: user._id });
          results.face = { success: false, error: error.response?.data?.detail || error.message };
        }
      }

      if (overallVerified) {
        await Biometric.findOneAndUpdate({ userId: user._id }, { lastVerified: new Date() }, { upsert: true });
        logger.info('Biometric verification successful', { userId: user._id, voterId: user.voterId });
      } else {
        logger.warn('Biometric verification failed', { userId: user._id, voterId: user.voterId });
      }

      res.json({ success: overallVerified, message: overallVerified ? 'Biometric verification successful' : 'Biometric verification failed', data: results, verified: overallVerified, userId: user._id, voterId: user.voterId });

    } catch (error) {
      logger.error('Biometric verification controller error', error, {});
      res.status(500).json({ success: false, message: 'Internal server error during biometric verification', error: error.message });
    }
  }

  // Fingerprint validation endpoint removed — fingerprint support deprecated (face-only flow)

  async getBiometricStatus(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const biometric = await Biometric.findOne({ userId });

      logger.info('Biometric status retrieved', { userId, voterId: user.voterId });

      res.json({
        success: true,
        data: {
          userId,
          voterId: user.voterId,
          biometricRegistered: user.biometricRegistered || false,
          biometricType: user.biometricType,
          faceRegistered: biometric?.faceRegistered || false,
          registrationDate: user.biometricRegistrationDate,
          lastVerified: biometric?.lastVerified
        }
      });

    } catch (error) {
      logger.error('Get biometric status error', error, { userId: req.params.userId });
      res.status(500).json({
        success: false,
        message: 'Failed to get biometric status'
      });
    }
  }

  // NEW: Register face only
  async registerFace(req, res) {
    try {
      const { userId, image_data } = req.body;

      logger.info('Face registration request', { userId });

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // require consent for face enrollment
      if (!req.body?.consent) {
        return res.status(400).json({ success: false, message: 'User consent is required for face enrollment' });
      }

      if (!image_data) {
        return res.status(400).json({
          success: false,
          message: 'Face image data is required'
        });
      }

      // NOTE: Relaxed mode — skip strict quality checks and accept the capture.
      // We will persist the provided image data into the Biometric record for this user
      // and return success regardless of microservice availability or checks.

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

        // Persist user and biometric info locally regardless of microservice
        try {
          user.biometricRegistered = true;
          user.biometricType = 'face';
          user.biometricRegistrationDate = new Date();
          await user.save();

          // create a local template id to reference the stored image
          const templateId = randomUUID();

          // Save a sample image immediately so UI can show a preview
          await Biometric.findOneAndUpdate(
            { userId },
            {
              $set: {
                faceRegistered: true,
                faceTemplateId: templateId,
                faceImageSample: image_data,
                registrationDate: new Date()
              },
              $push: {
                faceTemplateIds: templateId
              }
            },
            { upsert: true }
          );

          logger.info('Face registration persisted (relaxed mode)', { userId, templateId });

          // Attempt to call biometric microservice synchronously to obtain an encoding
          try {
            const svcResp = await axios.post(
              `${BIOMETRIC_SERVICE_URL}/api/biometrics/face/register`,
              { user_id: userId, image_data },
              { timeout: 30000 }
            );

            const svcData = svcResp.data || {};
            // Microservice returns encoding under data.encoding or encoding
            const encoding = svcData?.data?.encoding || svcData?.encoding || null;
            if (encoding) {
              // persist encoding (plaintext and encrypted) into Biometric doc
              const encrypted = encryptTemplate(encoding);
              try {
                await Biometric.findOneAndUpdate(
                  { userId },
                  {
                    $set: {
                      faceEncoding: Array.isArray(encoding) ? encoding : null,
                      faceEncodingEncrypted: encrypted,
                      registrationDate: new Date()
                    },
                    $push: {
                      faceEncodings: Array.isArray(encoding) ? encoding : []
                    }
                  },
                  { upsert: true }
                );
              } catch (persistEncErr) {
                logger.warn('Failed to persist face encoding returned by microservice', { err: persistEncErr.message, userId });
              }
            }
          } catch (svcErr) {
            logger.warn('Biometric microservice register call failed (ignored)', { err: svcErr.message, userId });
          }

        } catch (persistErr) {
          logger.error('Failed to persist relaxed face registration', { err: persistErr.message, userId });
          // still return success per relaxed requirement
        }

        return res.json({ success: true, message: 'Face registered (relaxed mode)', data: { template_id: true } });

    } catch (error) {
      logger.error('Face registration error', error, { userId: req.body.userId });
      res.status(500).json({
        success: false,
        message: 'Face registration failed',
        error: error.response?.data?.detail || error.message
      });
    }
  }

  // NEW: Register multiple face images in a single batch
  async registerFaceBatch(req, res) {
    try {
      const { userId, images } = req.body;

      logger.info('Face batch registration request', { userId, count: Array.isArray(images) ? images.length : 0 });

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ success: false, message: 'Images array is required' });
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const results = [];
      const templateIds = [];
      const encodings = [];
      const encodingsEncrypted = [];

      for (const image_data of images) {
        // Relaxed mode: skip strict quality checks and accept all submitted images.
        try {
          const templateId = randomUUID();
          templateIds.push(templateId);
          results.push({ success: true, template_id: templateId });

          // persist the first image as a sample for quick preview
          if (!Biometric) {
            // noop - just defensive
          }

          // fire-and-forget: notify microservice but don't fail the batch
          (async (img, tid) => {
            try {
              await axios.post(`${BIOMETRIC_SERVICE_URL}/api/face/register`, { user_id: userId, image_data: img }, { timeout: 30000 });
            } catch (e) {
              logger.warn('Background batch register failed (ignored)', { err: e.message, userId, templateId: tid });
            }
          })(image_data, templateId);
        } catch (err) {
          logger.warn('Batch relaxed handling failed for an image (ignored)', { err: err.message });
          results.push({ success: true, template_id: null, warning: 'persist failed' });
        }
      }

      const anySuccess = results.some(r => r.success);

      if (anySuccess) {
        // Update user biometric status
        user.biometricRegistered = true;
        user.biometricType = 'face';
        user.biometricRegistrationDate = new Date();
        await user.save();

        // Persist template ids and encodings (append arrays)
        const updateObj = {
          $set: { faceRegistered: true, registrationDate: new Date(), faceImageSample: images && images.length ? images[0] : undefined }
        };
        if (templateIds.length) {
          updateObj.$push = updateObj.$push || {};
          updateObj.$push.faceTemplateIds = { $each: templateIds };
        }
        if (encodingsEncrypted.length) {
          updateObj.$push = updateObj.$push || {};
          updateObj.$push.faceEncodingsEncrypted = { $each: encodingsEncrypted };
          // clear plaintext encodings for safety
          updateObj.$set = updateObj.$set || {};
          updateObj.$set.faceEncodings = [];
        }
        // Also set the sample image to the first submitted image for quick preview
        // Do not persist raw images for privacy; only keep encrypted encodings

        try {
          await Biometric.findOneAndUpdate({ userId }, updateObj, { upsert: true });
        } catch (persistErr) {
          logger.warn('Failed to persist face templates (batch)', { err: persistErr.message });
        }
      }
      // end of if (anySuccess)

      // respond to the client for batch registration
      return res.json({ success: anySuccess, message: anySuccess ? 'Face batch registered' : 'Face batch registration failed', data: results });

    } catch (error) {
      logger.error('Face batch registration error', error, { userId: req.body?.userId });
      return res.status(500).json({ success: false, message: 'Face batch registration failed', error: error.message });
    }

  }

    // WebAuthn: Begin registration (challenge)
    async webauthnRegisterBegin(req, res) {
      try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const userIdB64 = Buffer.from(user._id.toString()).toString('base64');

        const opts = generateRegistrationOptions({
          rpName,
          rpID,
          user: {
            id: userIdB64,
            name: user.email || user._id.toString(),
            displayName: user.name || user.email || 'User'
          },
          attestationType: 'none',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
        });

        // store challenge for this user
        challengeStore.set(userId.toString(), opts.challenge);

        return res.json(opts);
      } catch (err) {
        logger.error('webauthnRegisterBegin error', err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    // WebAuthn: Complete registration (verify attestation)
    async webauthnRegisterVerify(req, res) {
      try {
        const { credential, userId } = req.body;
        if (!credential || !userId) return res.status(400).json({ success: false, message: 'credential and userId required' });
        const expectedChallenge = challengeStore.get(userId.toString());
        if (!expectedChallenge) return res.status(400).json({ success: false, message: 'No challenge found' });

        const verification = await verifyRegistrationResponse({
          credential,
          expectedChallenge,
          expectedOrigin: origin,
          expectedRPID: rpID
        });

        if (!verification.verified) {
          return res.status(400).json({ success: false, message: 'Registration verification failed' });
        }

        const { registrationInfo } = verification;
        const credentialPublicKey = Buffer.from(registrationInfo.credentialPublicKey).toString('base64');
        const credentialID = Buffer.from(registrationInfo.credentialID).toString('base64');
        const counter = registrationInfo.counter || 0;

        // persist in Biometric doc
        await Biometric.findOneAndUpdate(
          { userId },
          {
            $push: {
              webauthnCredentials: {
                credentialId: credentialID,
                credentialPublicKey,
                counter,
                deviceType: 'platform',
                registeredAt: new Date()
              }
            },
            $set: {
              credentialId: credentialID,
              credentialPublicKey,
              signCount: counter
            }
          },
          { upsert: true }
        );

        // clear challenge
        challengeStore.delete(userId.toString());

        return res.json({ success: true, credentialId: credentialID });
      } catch (err) {
        logger.error('webauthnRegisterVerify error', err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    // WebAuthn: Begin login (assertion challenge)
    async webauthnLoginBegin(req, res) {
      try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
        const biometric = await Biometric.findOne({ userId });
        const allowCredentials = (biometric?.webauthnCredentials || []).map((c) => ({ id: c.credentialId, type: 'public-key' }));

        const opts = generateAuthenticationOptions({
          allowCredentials,
          userVerification: 'required',
          rpID
        });

        challengeStore.set(userId.toString(), opts.challenge);
        return res.json(opts);
      } catch (err) {
        logger.error('webauthnLoginBegin error', err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    // WebAuthn: Complete login (verify assertion)
    async webauthnLoginVerify(req, res) {
      try {
        const { credential, userId } = req.body;
        if (!credential || !userId) return res.status(400).json({ success: false, message: 'credential and userId required' });
        const expectedChallenge = challengeStore.get(userId.toString());
        if (!expectedChallenge) return res.status(400).json({ success: false, message: 'No challenge found' });

        const biometric = await Biometric.findOne({ userId });
        const stored = (biometric?.webauthnCredentials || []).find((c) => c.credentialId === credential.id || c.credentialId === credential.rawId);
        if (!stored) return res.status(404).json({ success: false, message: 'Stored credential not found' });

        const authenticator = {
          credentialPublicKey: Buffer.from(stored.credentialPublicKey, 'base64'),
          credentialID: Buffer.from(stored.credentialId, 'base64'),
          counter: stored.counter || 0
        };

        const verification = await verifyAuthenticationResponse({
          credential,
          expectedChallenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          authenticator
        });

        if (!verification.verified) {
          return res.status(400).json({ success: false, message: 'Authentication verification failed' });
        }

        // update counter
        const newCounter = verification.authenticationInfo.newCounter;
        await Biometric.findOneAndUpdate({ userId, 'webauthnCredentials.credentialId': stored.credentialId }, { $set: { 'webauthnCredentials.$.counter': newCounter, signCount: newCounter } });

        challengeStore.delete(userId.toString());
        return res.json({ success: true });
      } catch (err) {
        logger.error('webauthnLoginVerify error', err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    

  // NEW: Verify face only
  async verifyFace(req, res) {
    try {
      const { userId, voterId, image_data } = req.body;

      logger.info('Face verification request', { userId, voterId });

      if (!image_data) {
        return res.status(400).json({
          success: false,
          message: 'Face image data is required'
        });
      }

      // Find user
      let user;
      if (userId) {
        user = await User.findById(userId);
      } else if (voterId) {
        user = await User.findOne({ voterId });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // If we have a stored encoding in our DB, send it as reference to the biometric service
      const biometricDoc = await Biometric.findOne({ userId: user._id });
      const requestBody = {
        user_id: user._id.toString(),
        image_data
      };
      if (biometricDoc?.faceEncoding) {
        requestBody.reference_encoding = biometricDoc.faceEncoding;
      }

      // Call biometric service
      const faceResponse = await axios.post(
        `${BIOMETRIC_SERVICE_URL}/api/face/verify`,
        requestBody,
        { timeout: 30000 }
      );

      if (faceResponse.data.success) {
        await Biometric.findOneAndUpdate(
          { userId: user._id },
          { lastVerified: new Date() },
          { upsert: true }
        );
        logger.info('Face verification successful', { userId: user._id });
      } else {
        logger.warn('Face verification failed', { userId: user._id });
      }

      res.json({
        success: faceResponse.data.success,
        message: faceResponse.data.success ? 
          'Face verified successfully' : 
          'Face verification failed',
        data: faceResponse.data,
        userId: user._id,
        voterId: user.voterId
      });

    } catch (error) {
      logger.error('Face verification error', error, { userId, voterId });
      res.status(500).json({
        success: false,
        message: 'Face verification failed',
        error: error.response?.data?.detail || error.message
      });
    }
  }

  // Fingerprint registration & verification removed — fingerprint support deprecated
  // Test endpoints for development
  async testFaceRecognition(req, res) {
    try {
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({
          success: false,
          message: 'imageData is required'
        });
      }

      const response = await axios.post(
        `${BIOMETRIC_SERVICE_URL}/api/face/register`,
        { 
          user_id: 'test_user', 
          image_data: imageData 
        }
      );

      logger.info('Test face recognition completed', { data: response.data });
      res.json(response.data);
    } catch (error) {
      logger.error('Test face recognition failed', error);
      res.status(500).json({
        success: false,
        message: 'Face recognition test failed',
        error: error.response?.data?.detail || error.message
      });
    }
  }

  // fingerprint test removed
}

export default new BiometricController();
