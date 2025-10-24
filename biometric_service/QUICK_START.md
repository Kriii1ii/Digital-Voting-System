# ⚡ Quick Start Guide

Get the biometric service running in 5 minutes!

## 🚀 Installation & Setup

### Prerequisites Check
```bash
# Check Python version (need 3.8+)
python3 --version

# Check pip
pip3 --version
```

### Step 1: Install Dependencies

```bash
cd biometric_service

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

**Note**: If `face_recognition` installation fails, you may need system dependencies:

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install build-essential cmake libboost-python-dev
```

**macOS**:
```bash
brew install cmake boost
```

**Windows**:
- Install Visual Studio Build Tools from https://visualstudio.microsoft.com/downloads/
- Or use pre-built wheels: https://github.com/ageitgey/face_recognition#installation

### Step 2: Start the Service

**Option A: Using the startup script**
```bash
chmod +x start.sh
./start.sh
```

**Option B: Manually**
```bash
python app.py
```

The service will start on **http://localhost:8000**

### Step 3: Verify It's Working

Open your browser and go to:
- **API Docs**: http://localhost:8000/docs (Interactive Swagger UI)
- **Health Check**: http://localhost:8000/health
- **Test Page**: Open `example_client.html` in your browser

Or run the test script:
```bash
python test_api.py
```

## 🎯 Quick Test with Example Client

1. **Open the test page**:
   ```bash
   # Open example_client.html in your browser
   # On macOS:
   open example_client.html
   
   # On Linux:
   xdg-open example_client.html
   
   # On Windows:
   start example_client.html
   ```

2. **Test the flow**:
   - Click "Start Camera"
   - Allow camera access
   - Wait for the green border (quality check passed)
   - Enter a User ID (e.g., "test123")
   - Click "Register Face"
   - Wait for success message
   - Click "Authenticate Face" to test authentication

## 🔧 Using with cURL

### Register a face:
```bash
# First, encode an image
IMAGE_B64=$(base64 -w 0 your_face_photo.jpg)

# Register
curl -X POST http://localhost:8000/face/register \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"test123\",
    \"imageBase64\": \"data:image/jpeg;base64,$IMAGE_B64\"
  }"
```

### Authenticate:
```bash
curl -X POST http://localhost:8000/face/authenticate \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"test123\",
    \"imageBase64\": \"data:image/jpeg;base64,$IMAGE_B64\"
  }"
```

### Check quality:
```bash
curl -X POST http://localhost:8000/face/quality-check \
  -H "Content-Type: application/json" \
  -d "{
    \"imageBase64\": \"data:image/jpeg;base64,$IMAGE_B64\"
  }"
```

## 🐍 Using with Python

```python
import requests
import base64

# Read and encode image
with open('face_photo.jpg', 'rb') as f:
    img_b64 = base64.b64encode(f.read()).decode()

# Register
response = requests.post('http://localhost:8000/face/register', json={
    'user_id': 'test123',
    'imageBase64': f'data:image/jpeg;base64,{img_b64}'
})

print(response.json())

# Authenticate
response = requests.post('http://localhost:8000/face/authenticate', json={
    'user_id': 'test123',
    'imageBase64': f'data:image/jpeg;base64,{img_b64}'
})

print(response.json())
```

## 🌐 Using with JavaScript/Frontend

```javascript
// Capture from webcam
const video = document.getElementById('video');
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;

// Capture image
const canvas = document.createElement('canvas');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
canvas.getContext('2d').drawImage(video, 0, 0);
const imageBase64 = canvas.toDataURL('image/jpeg', 0.95);

// Register
const response = await fetch('http://localhost:8000/face/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'test123',
    imageBase64: imageBase64
  })
});

const result = await response.json();
console.log(result);
```

## 🐳 Docker Deployment

### Build and run with Docker:
```bash
docker build -t biometric-service .
docker run -p 8000:8000 -v $(pwd)/data:/app/data biometric-service
```

### Or use Docker Compose:
```bash
docker-compose up -d
```

## 📊 Understanding the Response

### Successful Registration:
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

### Failed Registration (Poor Quality):
```json
{
  "success": false,
  "message": "Image quality check failed",
  "reasons": [
    "Image too blurry (score: 75.2, minimum: 100)",
    "Image too dark (brightness: 35.1, minimum: 50)"
  ],
  "metrics": {
    "blur_score": 75.2,
    "brightness": 35.1,
    "face_count": 1
  },
  "feedback": [
    "💡 Tip: Hold your device steady for a clearer image",
    "💡 Tip: Try moving to a brighter location"
  ]
}
```

### Successful Authentication:
```json
{
  "success": true,
  "match": true,
  "score": 0.38,
  "confidence": "high",
  "message": "Authentication successful (confidence: high)",
  "metrics": { ... }
}
```

### Failed Authentication:
```json
{
  "success": true,
  "match": false,
  "score": 0.62,
  "confidence": "very_low",
  "message": "Authentication failed - face does not match (distance: 0.620)"
}
```

## 🎯 Quality Tips

For best results:
- ✅ Good, even lighting (not too bright or dark)
- ✅ Face directly towards camera
- ✅ Hold camera steady (avoid blur)
- ✅ Remove glasses if possible
- ✅ Neutral expression
- ✅ One person in frame
- ❌ Avoid backlighting
- ❌ Avoid extreme angles
- ❌ Avoid hats or masks

## 🔍 Troubleshooting

### Service won't start
```bash
# Check if port 8000 is already in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use a different port
uvicorn app:app --port 8001
```

### Installation errors
```bash
# If face_recognition fails, try installing dlib separately
pip install cmake
pip install dlib
pip install face_recognition
```

### Camera not working in browser
- **HTTPS required**: Browsers require HTTPS for camera access (except localhost)
- **Permissions**: Check browser camera permissions
- **Browser compatibility**: Use Chrome, Firefox, or Edge (not IE)

### Low quality warnings
- Improve lighting
- Use a better camera
- Clean camera lens
- Ensure face is properly framed
- Hold device steady

### "No face detected"
- Ensure face is visible and well-lit
- Move closer to camera
- Remove obstructions (hat, mask)
- Try different angle

## 📈 Next Steps

Once the service is running:

1. **Integrate with your backend** - See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
2. **Secure the API** - Add authentication, HTTPS
3. **Deploy to production** - Use Docker, cloud hosting
4. **Monitor performance** - Add logging, metrics
5. **Enhance security** - Add liveness detection, encryption

## 🆘 Getting Help

- **API Documentation**: http://localhost:8000/docs
- **Main README**: [README.md](README.md)
- **Integration Guide**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- **Check logs**: Console output shows detailed errors

## ✅ Checklist

- [ ] Python 3.8+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed successfully
- [ ] Service starts without errors
- [ ] Health check returns "healthy"
- [ ] Test page loads in browser
- [ ] Camera access working
- [ ] Face registration successful
- [ ] Face authentication working
- [ ] Ready to integrate with your app!

---

**Happy coding! 🚀**
