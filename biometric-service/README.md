# Biometric Service (face) — README

This directory contains a FastAPI-based biometric microservice (mock/mini-service) used by the Digital Voting System for face quality checks, registration, and verification.

Important: the service depends on native libraries (OpenCV) and Python packages that must be installed in a virtual environment. Follow the steps below to run locally.

## Quick start (local development)

1. Create and activate a virtual environment (macOS/Linux):

```bash
cd biometric-service
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

2. Run the service (mock / main):

```bash
# Run the main FastAPI biometric service
python main.py

# Or run the lightweight mock service for quick testing
python complete_mock_service.py

# Alternatively run with uvicorn directly (recommended for production-like runs):
uvicorn main:app --host 0.0.0.0 --port 8000
```

3. Test the health endpoint:

```bash
python server_test.py
# or (node):
node server_test.js
```

## Environment & configuration

- The backend expects an environment variable `BIOMETRIC_SERVICE_URL` (for example `http://localhost:8000`) so that the main Node backend can proxy requests to this service.

- The Node backend also expects a `BIOMETRIC_MASTER_KEY` for encrypting biometric templates. Do NOT commit this key. For local testing generate a temporary key:

```bash
python3 - <<'PY'
import base64, os
print(base64.b64encode(os.urandom(32)).decode())
PY
```

Set it before starting the Node backend:

```bash
export BIOMETRIC_SERVICE_URL="http://localhost:8000"
export BIOMETRIC_MASTER_KEY="<base64-32-bytes-key>"
```

## Notes

- This service uses heavy native dependencies (OpenCV, face-recognition). Installation on macOS may require `brew install pkg-config cmake libomp` and other build tools. If installation is problematic, use the `complete_mock_service.py` file for a pure-Python mock that does not require OpenCV/face-recognition.

- The code in `services/face_service.py` and `utils/*` provides a comprehensive flow for analyzing image quality and managing face templates. Use the mock for integration testing and replace with a production-capable model/service when ready.

- Do not commit any secret keys or actual biometric templates to the repository.

## End-to-end quick checklist

- Start biometric service (port 8000)
- Start backend (Node) with `BIOMETRIC_SERVICE_URL` pointing to the service and `BIOMETRIC_MASTER_KEY` set
- Start frontend (Vite)
- Walk through registration -> biometric validation -> submit flow in the UI

If you want, I can add a small shell script to start the three services together (with checks) — tell me and I will add it.
