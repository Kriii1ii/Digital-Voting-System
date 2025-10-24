# 🔗 Integration Guide - Biometric Service with Digital Voting System

This guide explains how to integrate the biometric service with your existing Node.js backend and React/Vite frontend.

## 📋 Table of Contents
- [Architecture Overview](#architecture-overview)
- [Backend Integration (Node.js)](#backend-integration-nodejs)
- [Frontend Integration (React/Vite)](#frontend-integration-reactvite)
- [Security Considerations](#security-considerations)
- [Testing](#testing)

---

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │◄────────┤  Node.js Backend│◄────────┤ Python Biometric│
│  (Vite/React)   │         │  (Express/Fast) │         │ Service (FastAPI│
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
       │                            │                            │
       │ getUserMedia()             │ Proxy/Direct Call         │
       │ (WebRTC)                   │ to Biometric API          │
       │                            │                            │
       └────────────────────────────┴────────────────────────────┘
                           MongoDB/PostgreSQL
```

### Flow Options:

**Option 1: Direct Frontend → Biometric Service** (Simpler)
- Frontend captures image via webcam
- Frontend sends image directly to biometric service
- Biometric service returns result
- Frontend sends result to Node backend for verification

**Option 2: Frontend → Node Backend → Biometric Service** (More Secure)
- Frontend captures image via webcam
- Frontend sends image to Node backend
- Node backend proxies request to biometric service
- Node backend validates and stores result in database

---

## 🔧 Backend Integration (Node.js)

### Step 1: Install HTTP Client

```bash
cd backend
npm install axios
```

### Step 2: Create Biometric Service Client

Create `backend/services/biometricService.js`:

```javascript
const axios = require('axios');

const BIOMETRIC_SERVICE_URL = process.env.BIOMETRIC_SERVICE_URL || 'http://localhost:8000';

class BiometricService {
  /**
   * Register a user's face
   */
  async registerFace(userId, imageBase64) {
    try {
      const response = await axios.post(`${BIOMETRIC_SERVICE_URL}/face/register`, {
        user_id: userId,
        imageBase64: imageBase64
      });
      return response.data;
    } catch (error) {
      throw new Error(`Face registration failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Authenticate a user via face recognition
   */
  async authenticateFace(userId, imageBase64, tolerance = 0.45) {
    try {
      const response = await axios.post(`${BIOMETRIC_SERVICE_URL}/face/authenticate`, {
        user_id: userId,
        imageBase64: imageBase64,
        tolerance: tolerance
      });
      return response.data;
    } catch (error) {
      throw new Error(`Face authentication failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Check image quality before registration
   */
  async checkFaceQuality(imageBase64) {
    try {
      const response = await axios.post(`${BIOMETRIC_SERVICE_URL}/face/quality-check`, {
        imageBase64: imageBase64
      });
      return response.data;
    } catch (error) {
      throw new Error(`Quality check failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Delete user's face registration
   */
  async deleteFaceRegistration(userId) {
    try {
      const response = await axios.delete(`${BIOMETRIC_SERVICE_URL}/face/delete/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Delete registration failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Register fingerprint
   */
  async registerFingerprint(userId, fingerprintData = null) {
    try {
      const response = await axios.post(`${BIOMETRIC_SERVICE_URL}/fingerprint/register`, {
        user_id: userId,
        fingerprint_data: fingerprintData
      });
      return response.data;
    } catch (error) {
      throw new Error(`Fingerprint registration failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Authenticate via fingerprint
   */
  async authenticateFingerprint(userId, fingerprintData = null) {
    try {
      const response = await axios.post(`${BIOMETRIC_SERVICE_URL}/fingerprint/authenticate`, {
        user_id: userId,
        fingerprint_data: fingerprintData
      });
      return response.data;
    } catch (error) {
      throw new Error(`Fingerprint authentication failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${BIOMETRIC_SERVICE_URL}/health`);
      return response.data;
    } catch (error) {
      throw new Error(`Biometric service unavailable: ${error.message}`);
    }
  }
}

module.exports = new BiometricService();
```

### Step 3: Create Biometric Routes

Create `backend/routes/biometric.js`:

```javascript
const express = require('express');
const router = express.Router();
const biometricService = require('../services/biometricService');
const { protect } = require('../middleware/authMiddleware'); // Your auth middleware

// Register face
router.post('/face/register', protect, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const userId = req.user.id; // From your auth middleware

    const result = await biometricService.registerFace(userId, imageBase64);
    
    if (result.success) {
      // Update user record in database
      req.user.biometricFaceRegistered = true;
      await req.user.save();
      
      res.json({
        success: true,
        message: 'Face registered successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Face registration failed',
        reasons: result.reasons,
        feedback: result.feedback
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Authenticate face
router.post('/face/authenticate', protect, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const userId = req.user.id;

    const result = await biometricService.authenticateFace(userId, imageBase64);
    
    if (result.success && result.match) {
      // Log successful authentication
      // Could generate a session token here
      res.json({
        success: true,
        message: 'Face authentication successful',
        authenticated: true,
        confidence: result.confidence
      });
    } else {
      // Log failed attempt
      res.status(401).json({
        success: false,
        message: 'Face authentication failed',
        authenticated: false
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Quality check
router.post('/face/quality-check', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const result = await biometricService.checkFaceQuality(imageBase64);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete face registration
router.delete('/face/delete', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await biometricService.deleteFaceRegistration(userId);
    
    // Update user record
    req.user.biometricFaceRegistered = false;
    await req.user.save();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
```

### Step 4: Add Routes to Server

In `backend/server.js`:

```javascript
const biometricRoutes = require('./routes/biometric');

// Add this with your other routes
app.use('/api/biometric', biometricRoutes);
```

### Step 5: Update User Model

In `backend/models/User.js`, add biometric fields:

```javascript
const userSchema = new mongoose.Schema({
  // ... existing fields
  
  biometricFaceRegistered: {
    type: Boolean,
    default: false
  },
  biometricFingerprintRegistered: {
    type: Boolean,
    default: false
  },
  lastBiometricAuth: {
    type: Date
  }
});
```

### Step 6: Environment Variables

In `backend/.env`:

```env
BIOMETRIC_SERVICE_URL=http://localhost:8000
```

---

## ⚛️ Frontend Integration (React/Vite)

### Step 1: Create Webcam Component

Create `frontend/src/components/BiometricCapture.jsx`:

```javascript
import React, { useState, useRef, useEffect } from 'react';

export default function BiometricCapture({ onCapture, onQualityCheck, mode = 'register' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [quality, setQuality] = useState(null);
  const [error, setError] = useState(null);

  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsReady(true);
        setError(null);
      }
    } catch (err) {
      setError('Unable to access camera: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsReady(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleCapture = () => {
    const imageData = captureImage();
    if (imageData && onCapture) {
      onCapture(imageData);
    }
  };

  const checkQuality = async () => {
    const imageData = captureImage();
    if (imageData && onQualityCheck) {
      const result = await onQualityCheck(imageData);
      setQuality(result);
    }
  };

  // Check quality periodically
  useEffect(() => {
    if (!isReady) return;
    
    const interval = setInterval(checkQuality, 1000);
    return () => clearInterval(interval);
  }, [isReady]);

  return (
    <div className="biometric-capture">
      <div className="video-container">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline
          className={quality?.passed ? 'quality-good' : 'quality-bad'}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {quality && (
          <div className="quality-overlay">
            {quality.passed ? (
              <span className="quality-badge good">✓ Ready</span>
            ) : (
              <span className="quality-badge bad">⚠ Adjust position</span>
            )}
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {quality?.feedback && (
        <div className="feedback">
          {quality.feedback.map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </div>
      )}

      <button 
        onClick={handleCapture} 
        disabled={!isReady || (quality && !quality.passed)}
        className="capture-btn"
      >
        {mode === 'register' ? 'Register Face' : 'Authenticate'}
      </button>
    </div>
  );
}
```

### Step 2: Create Biometric Service

Create `frontend/src/services/biometricService.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BIOMETRIC_URL = import.meta.env.VITE_BIOMETRIC_URL || 'http://localhost:8000';

class BiometricService {
  // Option 1: Direct call to biometric service
  async registerFaceDirect(userId, imageBase64) {
    const response = await axios.post(`${BIOMETRIC_URL}/face/register`, {
      user_id: userId,
      imageBase64
    });
    return response.data;
  }

  // Option 2: Via Node.js backend (recommended)
  async registerFace(imageBase64, token) {
    const response = await axios.post(
      `${API_BASE_URL}/biometric/face/register`,
      { imageBase64 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  async authenticateFace(imageBase64, token) {
    const response = await axios.post(
      `${API_BASE_URL}/biometric/face/authenticate`,
      { imageBase64 },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }

  async checkQuality(imageBase64) {
    // Can call directly for real-time feedback
    const response = await axios.post(`${BIOMETRIC_URL}/face/quality-check`, {
      imageBase64
    });
    return response.data;
  }

  async deleteFaceRegistration(token) {
    const response = await axios.delete(
      `${API_BASE_URL}/biometric/face/delete`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
}

export default new BiometricService();
```

### Step 3: Create Face Registration Page

Create `frontend/src/pages/FaceRegistration.jsx`:

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BiometricCapture from '../components/BiometricCapture';
import biometricService from '../services/biometricService';

export default function FaceRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const token = localStorage.getItem('token'); // Your auth token

  const handleCapture = async (imageData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await biometricService.registerFace(imageData, token);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard'); // Or next step
        }, 2000);
      } else {
        setError(result.reasons?.join(', ') || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQualityCheck = async (imageData) => {
    try {
      return await biometricService.checkQuality(imageData);
    } catch (err) {
      console.error('Quality check failed:', err);
      return null;
    }
  };

  return (
    <div className="face-registration">
      <h1>Register Your Face</h1>
      <p>Position your face in the camera frame</p>

      {!success ? (
        <BiometricCapture 
          onCapture={handleCapture}
          onQualityCheck={handleQualityCheck}
          mode="register"
        />
      ) : (
        <div className="success">
          ✅ Face registered successfully!
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Processing...</div>}
    </div>
  );
}
```

### Step 4: Create Face Authentication Page

Create `frontend/src/pages/FaceAuthentication.jsx`:

```javascript
import React, { useState } from 'react';
import BiometricCapture from '../components/BiometricCapture';
import biometricService from '../services/biometricService';

export default function FaceAuthentication({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const handleCapture = async (imageData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await biometricService.authenticateFace(imageData, token);
      
      if (result.authenticated) {
        // Authentication successful
        onSuccess?.(result);
      } else {
        setError('Face authentication failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleQualityCheck = async (imageData) => {
    try {
      return await biometricService.checkQuality(imageData);
    } catch (err) {
      return null;
    }
  };

  return (
    <div className="face-authentication">
      <h1>Verify Your Identity</h1>
      <p>Look at the camera to authenticate</p>

      <BiometricCapture 
        onCapture={handleCapture}
        onQualityCheck={handleQualityCheck}
        mode="authenticate"
      />

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Verifying...</div>}
    </div>
  );
}
```

### Step 5: Add Styles

Add to `frontend/src/index.css` or create a separate CSS file:

```css
.biometric-capture {
  max-width: 640px;
  margin: 0 auto;
}

.video-container {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.video-container video {
  width: 100%;
  height: auto;
  display: block;
  transition: border 0.3s;
}

.video-container video.quality-good {
  border: 3px solid #10b981;
}

.video-container video.quality-bad {
  border: 3px solid #ef4444;
}

.quality-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
}

.quality-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.quality-badge.good {
  background: #10b981;
  color: white;
}

.quality-badge.bad {
  background: #ef4444;
  color: white;
}

.capture-btn {
  width: 100%;
  padding: 16px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: #667eea;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.capture-btn:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
}

.capture-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback {
  margin-top: 15px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;
}

.error {
  color: #dc2626;
  padding: 12px;
  background: #fee2e2;
  border-radius: 8px;
  margin-top: 10px;
}

.success {
  color: #059669;
  padding: 12px;
  background: #d1fae5;
  border-radius: 8px;
  margin-top: 10px;
  text-align: center;
  font-size: 18px;
}
```

### Step 6: Environment Variables

In `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_BIOMETRIC_URL=http://localhost:8000
```

---

## 🔒 Security Considerations

### Production Deployment

1. **Use HTTPS everywhere**
   ```nginx
   # Nginx config
   server {
       listen 443 ssl;
       server_name biometric.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **Add API authentication**
   ```python
   # In app.py
   from fastapi.security import APIKeyHeader
   
   API_KEY = os.getenv("API_KEY")
   api_key_header = APIKeyHeader(name="X-API-Key")
   
   @app.post("/face/register")
   async def register_face(data: FaceRegisterRequest, api_key: str = Depends(api_key_header)):
       if api_key != API_KEY:
           raise HTTPException(status_code=403, detail="Invalid API key")
       # ... rest of code
   ```

3. **Rate limiting**
   ```bash
   pip install slowapi
   ```

4. **Encrypt stored embeddings**
   ```python
   from cryptography.fernet import Fernet
   
   cipher = Fernet(os.getenv("ENCRYPTION_KEY"))
   encrypted_data = cipher.encrypt(embedding.tobytes())
   ```

---

## 🧪 Testing

### Test the Integration

1. **Start all services**:
   ```bash
   # Terminal 1: Biometric service
   cd biometric_service
   ./start.sh
   
   # Terminal 2: Node backend
   cd backend
   npm run dev
   
   # Terminal 3: Frontend
   cd frontend
   npm run dev
   ```

2. **Test flow**:
   - Register a user via your normal registration
   - Navigate to face registration page
   - Allow camera access
   - Capture face
   - Verify in database that `biometricFaceRegistered = true`
   - Try authentication

### Troubleshooting

- **Camera not accessible**: Check HTTPS (required in production)
- **CORS errors**: Verify CORS settings in biometric service
- **Connection refused**: Ensure biometric service is running
- **Quality check failing**: Improve lighting, reduce blur

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [face_recognition Library](https://github.com/ageitgey/face_recognition)
- [WebRTC getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [WebAuthn Guide](https://webauthn.guide/)

---

**Need help?** Check the main README.md or open an issue!
