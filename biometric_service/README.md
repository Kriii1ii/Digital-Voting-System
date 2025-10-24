# 🔐 Biometric Verification Service

A FastAPI-based biometric authentication service for digital voting systems, featuring face recognition and fingerprint authentication capabilities.

## 🌟 Features

- **Face Registration**: Capture and store face encodings with quality validation
- **Face Authentication**: Verify identity by comparing face encodings
- **Quality Checking**: Real-time feedback on image quality (blur, brightness, face detection, head pose)
- **Fingerprint Support**: WebAuthn-ready endpoints with simulation mode
- **RESTful API**: Easy integration with any frontend or backend
- **CORS Enabled**: Ready for cross-origin requests
- **Production Ready**: Logging, error handling, and security features

## 📋 Requirements

- Python 3.8+
- Webcam (for face capture on client side)
- cmake (for dlib installation)

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate to the service directory
cd biometric_service

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Note**: Installing `dlib` requires `cmake`. If you encounter issues:

```bash
# Ubuntu/Debian
sudo apt-get install cmake

# macOS
brew install cmake

# Windows
# Download from https://cmake.org/download/
```

### 2. Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to customize settings:

```env
HOST=0.0.0.0
PORT=8000
FACE_MATCH_TOLERANCE=0.45
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Run the Service

```bash
# Development mode with auto-reload
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Production mode
python app.py
```

The service will be available at `http://localhost:8000`

### 4. Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📡 API Endpoints

### Health Check

```http
GET /health
```

Returns service status.

### Face Registration

```http
POST /face/register
Content-Type: application/json

{
  "user_id": "user123",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Face registered successfully",
  "embedding_shape": [128]
}
```

**Error Response (Quality Check Failed):**
```json
{
  "success": false,
  "message": "Image quality check failed",
  "reasons": [
    "Image too blurry (blur score: 85.3, minimum: 100)",
    "Image too dark (brightness: 42.1, minimum: 50)"
  ]
}
```

### Face Authentication

```http
POST /face/authenticate
Content-Type: application/json

{
  "user_id": "user123",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "success": true,
  "match": true,
  "score": 0.38,
  "message": "Authentication successful"
}
```

### Face Quality Check

```http
POST /face/quality-check
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:**
```json
{
  "passed": true,
  "reasons": ["All quality checks passed"],
  "metrics": {
    "blur_score": 145.2,
    "blur_pass": true,
    "brightness": 128.5,
    "brightness_pass": true,
    "face_count": 1,
    "face_count_pass": true
  }
}
```

### Check Registration Status

```http
GET /face/check-registration/{user_id}
```

**Response:**
```json
{
  "user_id": "user123",
  "registered": true,
  "message": "Face registered"
}
```

### Reset Registration

```http
DELETE /face/reset/{user_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Face registration reset successfully"
}
```

### Fingerprint Registration

```http
POST /fingerprint/register
Content-Type: application/json

{
  "user_id": "user123",
  "challenge": "optional-webauthn-challenge",
  "credential_id": "optional-credential-id",
  "public_key": "optional-public-key"
}
```

### Fingerprint Authentication

```http
POST /fingerprint/authenticate
Content-Type: application/json

{
  "user_id": "user123",
  "challenge": "optional-webauthn-challenge",
  "signature": "optional-signature"
}
```

### Fingerprint Simulation

```http
GET /fingerprint/simulate
```

Returns a server-sent event stream with simulated scan progress.

## 🔧 Frontend Integration

### Face Registration Example

```javascript
// Get video stream
const video = document.getElementById('video');
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;

// Capture image
function captureImage() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg');
}

// Register face
async function registerFace(userId) {
  const imageBase64 = captureImage();
  
  const response = await fetch('http://localhost:8000/face/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, imageBase64 })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Registration successful!');
  } else {
    console.log('Quality issues:', result.reasons);
    // Show reasons to user and allow retake
  }
}
```

### Face Authentication Example

```javascript
async function authenticateFace(userId) {
  const imageBase64 = captureImage();
  
  const response = await fetch('http://localhost:8000/face/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, imageBase64 })
  });
  
  const result = await response.json();
  
  if (result.match) {
    console.log('Authentication successful! Score:', result.score);
    // Proceed with voting
  } else {
    console.log('Authentication failed. Score:', result.score);
    // Show error and allow retry
  }
}
```

### Real-time Quality Feedback

```javascript
async function checkQuality() {
  const imageBase64 = captureImage();
  
  const response = await fetch('http://localhost:8000/face/quality-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 })
  });
  
  const result = await response.json();
  
  // Display feedback
  if (result.passed) {
    showFeedback('Good quality - ready to capture!', 'success');
  } else {
    showFeedback(result.reasons.join(', '), 'warning');
  }
}

// Check quality every 2 seconds during preview
setInterval(checkQuality, 2000);
```

## 🎯 Quality Check Criteria

| Check | Requirement | Purpose |
|-------|-------------|---------|
| **Face Count** | Exactly 1 | Ensure single person |
| **Blur Score** | ≥ 100 | Prevent blurry images |
| **Brightness** | 50-200 | Ensure proper lighting |
| **Head Pose** | Frontal | Ensure face is centered |

## 🔒 Security Best Practices

### For Development
- Service runs on localhost only
- CORS allows all origins (for testing)
- No encryption on stored embeddings

### For Production

1. **Use HTTPS**: Always serve over TLS
   ```bash
   uvicorn app:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem
   ```

2. **Restrict CORS**: Update `.env` with specific origins
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

3. **Encrypt Data**: Enable embedding encryption
   ```env
   ENABLE_ENCRYPTION=true
   SECRET_KEY=your-strong-secret-key
   ```

4. **Add Authentication**: Protect endpoints with API keys or JWT

5. **Rate Limiting**: Implement rate limits to prevent abuse

6. **Audit Logging**: Log all authentication attempts

7. **Database Storage**: Move from file-based to database storage

8. **Anti-Spoofing**: Add liveness detection (eye blink, motion)

## 📁 Project Structure

```
biometric_service/
│
├── app.py                 # Main FastAPI application
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
│
├── models/
│   ├── __init__.py
│   └── user_faces.py     # Pydantic models
│
├── utils/
│   ├── __init__.py
│   ├── quality_check.py  # Image quality validation
│   └── face_utils.py     # Face recognition utilities
│
└── data/
    └── faces/            # Stored face encodings (.npy files)
```

## 🧪 Testing

### Manual Testing

1. **Test Health Check**:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Test with Sample Image**:
   ```bash
   # Create a test script (see test_api.py below)
   python test_api.py
   ```

### Create Test Script

Save as `test_api.py`:

```python
import requests
import base64

# Read a test image
with open("test_face.jpg", "rb") as f:
    img_base64 = base64.b64encode(f.read()).decode()
    img_data = f"data:image/jpeg;base64,{img_base64}"

# Test registration
response = requests.post(
    "http://localhost:8000/face/register",
    json={"user_id": "test_user", "imageBase64": img_data}
)
print("Registration:", response.json())

# Test authentication
response = requests.post(
    "http://localhost:8000/face/authenticate",
    json={"user_id": "test_user", "imageBase64": img_data}
)
print("Authentication:", response.json())
```

## 🐛 Troubleshooting

### dlib Installation Fails

**Problem**: `cmake` not found or compilation errors

**Solution**:
```bash
# Install cmake first
sudo apt-get install cmake build-essential
# Or on Mac: brew install cmake

# Then install dlib
pip install dlib
```

### No Face Detected

**Problem**: API returns "No face detected"

**Solutions**:
- Ensure good lighting
- Face should be clearly visible and frontal
- Try different camera angle
- Check image quality (not too small/large)

### Quality Check Always Fails

**Problem**: Images fail blur or brightness checks

**Solutions**:
- Improve lighting conditions
- Ensure camera is in focus
- Clean camera lens
- Adjust quality thresholds in `.env`

### CORS Errors

**Problem**: Browser blocks requests

**Solution**:
```env
# Add your frontend URL to ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 🔄 Integration with Node.js Backend

### Option 1: Direct Frontend Calls

Frontend calls Python service directly for biometric operations.

```javascript
// Frontend
const result = await fetch('http://localhost:8000/face/register', {...});
```

### Option 2: Proxy Through Node.js

Node.js backend proxies requests to Python service.

```javascript
// Node.js backend
const axios = require('axios');

app.post('/api/biometric/register', async (req, res) => {
  const result = await axios.post('http://localhost:8000/face/register', {
    user_id: req.body.user_id,
    imageBase64: req.body.imageBase64
  });
  res.json(result.data);
});
```

## 📈 Performance Tuning

- **Face Detection**: Uses HOG model (fast). For accuracy, switch to CNN model
- **Image Size**: Resize large images before sending (max 800x600 recommended)
- **Batch Processing**: Process multiple faces using async/await
- **Caching**: Cache face encodings in memory for repeated authentications

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM python:3.9-slim

RUN apt-get update && apt-get install -y cmake build-essential

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

```env
HOST=0.0.0.0
PORT=8000
FACE_MATCH_TOLERANCE=0.45
ALLOWED_ORIGINS=https://yourdomain.com
LOG_LEVEL=INFO
ENABLE_ENCRYPTION=true
SECRET_KEY=your-production-secret-key
```

## 📝 License

This project is part of a digital voting system.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Check logs for detailed error messages

## 🔮 Future Enhancements

- [ ] Liveness detection (eye blink, motion)
- [ ] Multi-factor biometric (face + fingerprint)
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] WebAuthn full implementation
- [ ] Face embedding encryption
- [ ] Audit trail and logging dashboard
- [ ] Anti-spoofing improvements
- [ ] Mobile app support
