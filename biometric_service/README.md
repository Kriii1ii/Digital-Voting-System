# 🔐 Biometric Verification Service

A FastAPI-based biometric authentication service for digital voting systems, featuring face recognition and fingerprint authentication.

## 🌟 Features

### Face Recognition
- **Live Registration**: Capture face images with real-time quality feedback
- **Quality Checking**: Automatic validation for blur, brightness, face count, and head pose
- **Authentication**: Secure face matching using 128-D embeddings
- **Privacy-Focused**: Stores only mathematical representations (embeddings), not raw images

### Fingerprint Authentication
- **Simulation Mode**: Test fingerprint workflows without physical hardware
- **WebAuthn Ready**: Architecture supports integration with browser-based biometric APIs
- **Progress Feedback**: Visual feedback during fingerprint scanning

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip package manager
- Webcam (for face recognition)

### Installation

1. **Navigate to the service directory**:
```bash
cd biometric_service
```

2. **Create a virtual environment**:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

> **Note**: Installing `face_recognition` requires `dlib`, which may need additional system dependencies:
> - **Ubuntu/Debian**: `sudo apt-get install cmake libboost-python-dev`
> - **macOS**: `brew install cmake boost`
> - **Windows**: Install Visual Studio Build Tools

### Running the Service

**Development mode** (with auto-reload):
```bash
python app.py
```

**Production mode**:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

The service will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📡 API Endpoints

### Face Recognition

#### Register Face
```http
POST /face/register
Content-Type: application/json

{
  "user_id": "user123",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Face registered successfully",
  "embedding_shape": [128],
  "metrics": {
    "blur_score": 245.3,
    "brightness": 128.5,
    "face_count": 1,
    "image_size": "640x480"
  },
  "feedback": ["✅ Perfect! Face registered successfully"]
}
```

#### Authenticate Face
```http
POST /face/authenticate
Content-Type: application/json

{
  "user_id": "user123",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "tolerance": 0.45
}
```

**Response**:
```json
{
  "success": true,
  "match": true,
  "score": 0.38,
  "confidence": "high",
  "message": "Authentication successful (confidence: high)",
  "metrics": {...}
}
```

#### Quality Check
```http
POST /face/quality-check
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response**:
```json
{
  "passed": true,
  "reasons": [],
  "metrics": {
    "blur_score": 245.3,
    "brightness": 128.5,
    "face_count": 1
  },
  "feedback": ["✅ Image quality is excellent!"]
}
```

### Fingerprint Authentication

#### Register Fingerprint
```http
POST /fingerprint/register
Content-Type: application/json

{
  "user_id": "user123",
  "fingerprint_data": "optional_credential_data"
}
```

#### Authenticate Fingerprint
```http
POST /fingerprint/authenticate
Content-Type: application/json

{
  "user_id": "user123",
  "fingerprint_data": "optional_credential_data"
}
```

### Utility Endpoints

#### Health Check
```http
GET /health
```

#### Delete Registration
```http
DELETE /face/delete/{user_id}
DELETE /fingerprint/delete/{user_id}
```

## 🎨 Frontend Integration

### Capturing Face Image

```javascript
// Get video stream from webcam
const video = document.getElementById('video');
const stream = await navigator.mediaDevices.getUserMedia({ 
  video: { width: 640, height: 480 } 
});
video.srcObject = stream;

// Capture image
function captureImage() {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
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
  
  if (!result.success) {
    // Show reasons and feedback
    console.log('Quality issues:', result.reasons);
    console.log('Feedback:', result.feedback);
    // Allow retake
  } else {
    console.log('Registration successful!');
  }
}
```

### Real-time Quality Feedback

```javascript
// Check quality before registration
async function checkQuality() {
  const imageBase64 = captureImage();
  
  const response = await fetch('http://localhost:8000/face/quality-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 })
  });
  
  const result = await response.json();
  
  // Display feedback to user
  displayFeedback(result.feedback);
  
  // Enable/disable capture button based on quality
  captureButton.disabled = !result.passed;
}

// Check quality periodically (e.g., every 500ms)
setInterval(checkQuality, 500);
```

## 🔒 Security Considerations

### Current Implementation
- ✅ Face embeddings stored (not raw images)
- ✅ CORS protection configured
- ✅ Input validation with Pydantic models
- ✅ Configurable matching tolerance

### Production Recommendations
1. **HTTPS Only**: Always use TLS/SSL in production
2. **Authentication**: Add API key or JWT authentication
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Encryption at Rest**: Encrypt .npy files or use encrypted database
5. **Audit Logging**: Log all authentication attempts
6. **Liveness Detection**: Add anti-spoofing checks (blink detection, motion)
7. **Database Storage**: Move from file storage to encrypted database
8. **Secret Management**: Use environment variables for sensitive configuration

### Adding HTTPS (Production)
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 \
  --ssl-keyfile=/path/to/key.pem \
  --ssl-certfile=/path/to/cert.pem
```

### Adding Rate Limiting
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/face/register")
@limiter.limit("5/minute")
async def register_face(request: Request, data: FaceRegisterRequest):
    # ... existing code
```

## 🧪 Testing

### Manual Testing with cURL

**Register a face**:
```bash
# First, capture an image and save as base64
IMAGE_DATA=$(base64 -w 0 face.jpg)

curl -X POST http://localhost:8000/face/register \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"test123\", \"imageBase64\": \"data:image/jpeg;base64,$IMAGE_DATA\"}"
```

**Authenticate**:
```bash
curl -X POST http://localhost:8000/face/authenticate \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"test123\", \"imageBase64\": \"data:image/jpeg;base64,$IMAGE_DATA\"}"
```

### Testing with Python

```python
import requests
import base64

# Read image
with open('face.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode()

# Register
response = requests.post('http://localhost:8000/face/register', json={
    'user_id': 'test123',
    'imageBase64': f'data:image/jpeg;base64,{image_data}'
})
print(response.json())
```

## 📊 Quality Metrics

### Blur Score
- **Good**: > 150
- **Acceptable**: 100-150
- **Poor**: < 100
- **Measured by**: Laplacian variance

### Brightness
- **Good**: 80-180
- **Acceptable**: 50-200
- **Poor**: < 50 or > 200
- **Measured by**: Mean grayscale value

### Match Score (Distance)
- **Very High Confidence**: < 0.30
- **High Confidence**: 0.30-0.40
- **Medium Confidence**: 0.40-0.45 (threshold)
- **Low Confidence**: 0.45-0.55
- **No Match**: > 0.55

## 🛠️ Architecture

```
biometric_service/
├── app.py                    # Main FastAPI application
├── models/
│   ├── __init__.py
│   └── user_faces.py        # Pydantic models
├── utils/
│   ├── __init__.py
│   ├── face_utils.py        # Face encoding & comparison
│   └── quality_check.py     # Image quality validation
├── data/
│   ├── faces/               # Face embeddings (.npy files)
│   └── fingerprints/        # Fingerprint data (simulated)
├── requirements.txt
└── README.md
```

## 🔧 Configuration

### Adjusting Match Tolerance

Lower tolerance = stricter matching:
```python
# More strict (fewer false positives)
tolerance = 0.40

# Default (balanced)
tolerance = 0.45

# More lenient (fewer false negatives)
tolerance = 0.50
```

### Adjusting Quality Thresholds

Modify in `utils/quality_check.py`:
```python
def check_quality(
    img, 
    min_blur=100,         # Lower = more lenient
    min_brightness=50,    # Lower = accept darker images
    max_brightness=200    # Higher = accept brighter images
):
    # ...
```

## 🌐 CORS Configuration

Update allowed origins in `app.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # React dev server
        "http://localhost:5173",      # Vite dev server
        "https://yourdomain.com",     # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📝 Troubleshooting

### Installation Issues

**dlib installation fails**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install build-essential cmake libboost-python-dev

# macOS
brew install cmake boost
```

**face_recognition installation fails**:
- Try installing dlib separately first: `pip install dlib`
- On Windows, use pre-built wheels: https://github.com/ageitgey/face_recognition#installation

### Runtime Issues

**"No face detected"**:
- Ensure good lighting
- Face should be clearly visible and frontal
- Check image quality with `/face/quality-check`

**"Image too blurry"**:
- Use better camera
- Hold device steady
- Increase lighting
- Reduce motion blur

**False negatives (should match but doesn't)**:
- Increase tolerance (e.g., 0.50)
- Check lighting consistency between registration and authentication
- Ensure face is in similar position/angle

**False positives (matches when it shouldn't)**:
- Decrease tolerance (e.g., 0.40)
- Improve registration image quality
- Consider adding liveness detection

## 🚀 Future Enhancements

- [ ] Add liveness detection (blink detection, motion tracking)
- [ ] Support multiple face encodings per user
- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] WebAuthn integration for real fingerprint authentication
- [ ] Age/gender estimation
- [ ] Emotion detection
- [ ] Multi-factor authentication combinations
- [ ] Admin dashboard for monitoring
- [ ] Batch registration/authentication
- [ ] Face anti-spoofing (photo detection)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- GitHub Issues: [Your repo URL]
- Documentation: http://localhost:8000/docs
- Email: [Your email]

---

**Built with ❤️ for secure digital voting systems**
