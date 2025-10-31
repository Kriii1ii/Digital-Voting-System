import React, { useState } from 'react';
import LiveFaceCapture from './LiveFaceCapture';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ✅ Backend base URL (switches automatically between dev/prod)
// Default to empty string so Vite dev proxy ("/api" -> backend) is used when VITE_API_URL is not set
const API_BASE = import.meta.env.VITE_API_URL || '';

const BiometricChoice = ({ userId, onCompletion, mode = 'registration' }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [faceData, setFaceData] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Biometric UI is available without login
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const handleFaceCapture = async (imageData) => {
    try {
      const tokenLocal = localStorage.getItem('token');
      const effectiveUserId = user?._id || userId;

      if (Array.isArray(imageData)) {
        // Batch submit: send all images in one request to backend
        try {
          const url = `${API_BASE}/api/biometrics/face/register-batch`;
          const res = await axios.post(
            url,
            { userId: effectiveUserId, images: imageData },
            { headers: { Authorization: `Bearer ${tokenLocal}` } }
          );
          if (res.data && res.data.success) {
            onCompletion && onCompletion(res.data);
          } else {
            throw new Error('Batch register failed');
          }
        } catch (err) {
          console.error('Batch face register error', err);
          setError('Failed to register face images');
        }
        return;
      }

      // Single-image flow: validate then register/verify
      const validationResponse = await axios.post(
        `${API_BASE}/api/biometrics/face/validate`,
        { image: imageData },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(tokenLocal && { Authorization: `Bearer ${tokenLocal}` })
          }
        }
      );

      const payload = validationResponse.data || {};
      const details = payload.details || payload.quality_metrics || {};

      // Reject if no face detected
      if (payload.face_detected === false) {
        setError('No face detected in the image. Please try again.');
        return;
      }

      // If backend returned an explicit error
      if (payload.error) {
        setError(`Face validation failed: ${payload.error}`);
        return;
      }

      // Accept user photo unless something actually covers their face (mask/obstruction)
      const obstructed = details.no_obstructions === false || details.mask === true || details.covering === true || details.obstruction === true;
      if (obstructed) {
        setError('Please remove any masks or face coverings and try again.');
        return;
      }

      // If validation successful, proceed with registration/verification
      setFaceData(imageData);
      if (mode === 'registration') {
        onCompletion({ type: 'face', data: imageData, quality_metrics });
      } else {
        await handleSubmit('face', imageData, null);
      }
    } catch (err) {
      console.error('Face capture error:', err);
      setError(err.response?.data?.message || 'Face capture failed.');
    }
  };

  // fingerprint support removed — face-only flow

  const handleSubmit = async (biometricType, faceData, fingerprintData) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Add user ID from context if not provided
      const effectiveUserId = userId || user?._id;

      if (!effectiveUserId) {
        throw new Error('User ID is required for biometric registration/verification');
      }

      let endpoint;
      // Face-only endpoints
      if (mode === 'registration') {
        endpoint = '/api/biometrics/face/register';
      } else {
        endpoint = '/api/biometrics/face/verify';
      }

      // Resolve token from AuthContext or local/session storage
      const resolvedToken =
        token ||
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('jwt') ||
        sessionStorage.getItem('token') ||
        null;

      const config = resolvedToken
        ? { headers: { Authorization: `Bearer ${resolvedToken}` } }
        : {};

      // ✅ Fixed: ensure backend URL is included
      const requestData = {
        userId: effectiveUserId,
        biometricType: 'face',
        ...(faceData && { image: faceData })
      };

      const response = await axios.post(
        `${API_BASE}${endpoint}`,
        requestData,
        {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        onCompletion(response.data);

        // ✅ Added: success alert for user feedback
        if (mode === 'registration') {
          alert('✅ Biometric registration successful!');
        } else {
          alert('✅ Verification successful — you are authenticated.');
        }
      } else {
        setError(response.data.message || `${biometricType} ${mode} failed`);
      }
    } catch (err) {
      console.error('Biometric API error:', err);
      setError(err.response?.data?.message || 'Server communication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSelection = () => {
    setSelectedOption('');
    setFaceData(null);
    // fingerprint state removed — keep face-only
    setError('');
  };

  return (
    <div className="biometric-choice" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {/* Decorative banner — improved aesthetics and aligned with choice card */}
          <div style={{
            width: '100%',
            maxWidth: 760,
            background: 'linear-gradient(180deg,#f6dfe1 0%,#f0d6d8 100%)',
            borderRadius: 14,
            padding: 20,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            border: '1px solid rgba(0,0,0,0.04)',
            boxShadow: '0 10px 30px rgba(16,24,40,0.06)'
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#9b3740',
              boxShadow: '0 4px 12px rgba(16,24,40,0.06)'
            }}>
              N.M
            </div>
            <div>
              <h2 style={{ color: 'var(--color-dark)', margin: 0, fontSize: 28, fontWeight: 800 }}>Biometric Authentication</h2>
              <p className="mb-0 mt-1" style={{ color: 'var(--color-dark)', opacity: 0.85, margin: 0, fontSize: 16 }}>
                {mode === 'registration' ? 'You can register for biometrics here.' : 'Select a method for verification'}
              </p>
            </div>
          </div>

      {error && <div className="error-message">{error}</div>}

      {/* --- Step 1: Choose Method --- */}
      {!selectedOption ? (
        <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: '0 12px', display: 'flex', justifyContent: 'center' }}>
          <div
            onClick={() => setSelectedOption('face')}
            className="transition-all cursor-pointer"
            style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: 24,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 10px 30px rgba(16,24,40,0.06)',
              display: 'flex',
              flexDirection: 'column',
              width: 360,
              minHeight: 180,
              position: 'relative',
              overflow: 'visible'
            }}
          >
            <div style={{ flex: 1 }}>
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#111827', margin: 0, lineHeight: 1.05 }}>Face<br/>Recognition</h3>
              <p style={{ color: '#111827', opacity: 0.8, marginTop: 12, maxWidth: 300 }}>Use your webcam to capture a live image</p>
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <button
                onClick={() => setSelectedOption('face')}
                className="rounded-full transition-colors"
                style={{ background: 'var(--color-accent)', color: 'var(--color-dark)', fontWeight: 700, padding: '12px 40px', borderRadius: 18, boxShadow: '0 8px 20px rgba(16,24,40,0.12)' }}
              >
                Choose Face
              </button>
            </div>
          </div>

          {/* Fingerprint option removed — face-only flow */}

          {/* both option removed - single-method flows only */}
        </div>
      ) : (
        <div className="biometric-capture">
          {/* --- Face Capture --- */}
          {selectedOption === 'face' && (
            <LiveFaceCapture onCapture={handleFaceCapture} onError={setError} />
          )}

          {/* Fingerprint capture removed — face-only flow */}

          {/* both option removed - keep single flows */}

          {/* --- Back Button --- */}
          <div className="back-section mt-4">
            <button onClick={resetSelection} className="px-3 py-2 rounded-md" style={{ background: 'var(--color-accent)', color: 'var(--color-dark)' }}>
              ← Go back
            </button>
          </div>
        </div>
      )}

      <div className="privacy-notice">
        <p>
          <strong>Privacy & Security:</strong> Biometric data is encrypted and
          stored securely. Only encoded templates are used for
          verification. You can update your biometrics anytime.
        </p>
      </div>
    </div>
  );
};

export default BiometricChoice;
