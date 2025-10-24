# ⚡ Quick Start Guide

Get the Biometric Verification Service up and running in 5 minutes!

## 🚀 Installation (One Command)

```bash
./start.sh
```

That's it! The service will be running at `http://localhost:8000`

## 📖 Manual Setup

### 1. Install Dependencies

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### 2. Start the Service

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 3. Test It

Open http://localhost:8000/docs in your browser to see the API documentation.

## 🧪 Quick Test

```bash
# In a new terminal
python test_api.py
```

## 📱 Try the Demo

Open `examples/frontend_integration.html` in your browser to see a working demo with live camera preview.

## 🔑 Common Commands

```bash
# Start service
uvicorn app:app --reload

# Start with custom port
uvicorn app:app --reload --port 8080

# Check health
curl http://localhost:8000/health

# View API docs
# Open: http://localhost:8000/docs

# Run tests
python test_api.py
```

## 🎯 First Steps

### 1. Register a Face

```bash
curl -X POST http://localhost:8000/face/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "imageBase64": "data:image/jpeg;base64,..."
  }'
```

### 2. Authenticate

```bash
curl -X POST http://localhost:8000/face/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "imageBase64": "data:image/jpeg;base64,..."
  }'
```

## 🔧 Configuration

Copy `.env.example` to `.env` and adjust settings:

```env
HOST=0.0.0.0
PORT=8000
FACE_MATCH_TOLERANCE=0.45
```

## 📚 Next Steps

- Read the [full README](README.md) for detailed documentation
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
- Review the [API documentation](http://localhost:8000/docs)
- Try the [frontend example](examples/frontend_integration.html)

## ⚠️ Troubleshooting

### Cannot install dlib

```bash
# Ubuntu/Debian
sudo apt-get install cmake build-essential

# macOS
brew install cmake

# Then retry
pip install dlib
```

### Port already in use

```bash
# Change port in .env or use:
uvicorn app:app --reload --port 8080
```

### CORS errors

Add your frontend URL to `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 🆘 Help

- Check logs for errors
- Review [README.md](README.md) for detailed info
- Test with `curl` commands first
- Ensure camera permissions are granted (for frontend)

## 🎉 Success!

You should now have:
- ✅ Service running at http://localhost:8000
- ✅ API documentation at http://localhost:8000/docs
- ✅ Ready to integrate with your frontend

Happy coding! 🚀
