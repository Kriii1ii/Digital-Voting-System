from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
from datetime import datetime
import uuid

app = FastAPI(
    title="Mock Biometric Service",
    description="Complete mock service for testing biometric integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class BiometricResponse(BaseModel):
    success: bool
    data: dict
    message: str

class FaceRegistrationRequest(BaseModel):
    user_id: str
    image_data: str

class FingerprintRegistrationRequest(BaseModel):
    user_id: str
    sensor_data: dict

# Mock storage
face_encodings = {}
fingerprint_templates = {}

@app.get("/")
async def root():
    return {
        "message": "Mock Biometric Service", 
        "endpoints": [
            "/api/health", 
            "/api/face/register", 
            "/api/face/verify", 
            "/api/fingerprint/register", 
            "/api/fingerprint/verify",
            "/docs",
            "/redoc"
        ]
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "mock-biometric", 
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "face_register": "/api/face/register",
            "face_verify": "/api/face/verify", 
            "fingerprint_register": "/api/fingerprint/register",
            "fingerprint_verify": "/api/fingerprint/verify"
        }
    }

@app.post("/api/face/register", response_model=BiometricResponse)
async def register_face(request: FaceRegistrationRequest):
    """Mock face registration"""
    try:
        print(f"🔍 Face registration request for user: {request.user_id}")
        
        # Simulate face detection and encoding
        quality_score = round(random.uniform(0.7, 0.95), 2)
        encoding_id = str(uuid.uuid4())
        
        # Store mock encoding
        face_encodings[request.user_id] = {
            "encoding_id": encoding_id,
            "encoding": [round(random.random(), 6) for _ in range(128)],
            "quality_score": quality_score,
            "face_detected": True,
            "registered_at": datetime.now().isoformat()
        }
        
        response_data = {
            "user_id": request.user_id,
            "encoding_id": encoding_id,
            "quality_score": quality_score,
            "face_detected": True,
            "encoding_length": 128,
            "lighting_condition": "good",
            "confidence": round(random.uniform(0.8, 0.95), 2)
        }
        
        print(f"✅ Face registered successfully: {response_data}")
        
        return BiometricResponse(
            success=True,
            data=response_data,
            message="Face registered successfully"
        )
    except Exception as e:
        print(f"❌ Face registration error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/face/verify", response_model=BiometricResponse)
async def verify_face(request: FaceRegistrationRequest):
    """Mock face verification"""
    try:
        print(f"🔍 Face verification request for user: {request.user_id}")
        
        if request.user_id not in face_encodings:
            return BiometricResponse(
                success=False,
                data={"verified": False, "confidence": 0.0},
                message="User face not registered"
            )
        
        # Simulate verification with 85% success rate
        verified = random.random() > 0.15
        confidence = round(random.uniform(0.7, 0.98), 2) if verified else round(random.uniform(0.3, 0.6), 2)
        
        response_data = {
            "verified": verified,
            "confidence": confidence,
            "threshold": 0.6,
            "face_detected": True,
            "user_id": request.user_id,
            "lighting_condition": "good"
        }
        
        print(f"✅ Face verification: {response_data}")
        
        return BiometricResponse(
            success=verified,
            data=response_data,
            message="Face verification successful" if verified else "Face verification failed"
        )
    except Exception as e:
        print(f"❌ Face verification error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/fingerprint/register", response_model=BiometricResponse)
async def register_fingerprint(request: FingerprintRegistrationRequest):
    """Mock fingerprint registration"""
    try:
        print(f"🔍 Fingerprint registration for user: {request.user_id}")
        
        quality_score = round(random.uniform(0.75, 0.98), 2)
        template_id = str(uuid.uuid4())
        
        fingerprint_templates[request.user_id] = {
            "template_id": template_id,
            "template": {"minutiae_count": random.randint(30, 45)},
            "quality_score": quality_score,
            "sensor_type": request.sensor_data.get("sensor_type", "simulated"),
            "registered_at": datetime.now().isoformat()
        }
        
        response_data = {
            "user_id": request.user_id,
            "template_id": template_id,
            "sensor_type": request.sensor_data.get("sensor_type", "simulated"),
            "quality_score": quality_score,
            "minutiae_count": random.randint(30, 45),
            "template_size": 256
        }
        
        print(f"✅ Fingerprint registered: {response_data}")
        
        return BiometricResponse(
            success=True,
            data=response_data,
            message="Fingerprint registered successfully"
        )
    except Exception as e:
        print(f"❌ Fingerprint registration error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/fingerprint/verify", response_model=BiometricResponse)
async def verify_fingerprint(request: FingerprintRegistrationRequest):
    """Mock fingerprint verification"""
    try:
        print(f"🔍 Fingerprint verification for user: {request.user_id}")
        
        if request.user_id not in fingerprint_templates:
            return BiometricResponse(
                success=False,
                data={"verified": False, "confidence": 0.0},
                message="User fingerprint not registered"
            )
        
        verified = random.random() > 0.1  # 90% success rate
        confidence = round(random.uniform(0.75, 0.99), 2) if verified else round(random.uniform(0.4, 0.6), 2)
        
        response_data = {
            "verified": verified,
            "confidence": confidence,
            "sensor_type": request.sensor_data.get("sensor_type", "simulated"),
            "quality": round(random.uniform(0.8, 0.95), 2),
            "user_id": request.user_id
        }
        
        print(f"✅ Fingerprint verification: {response_data}")
        
        return BiometricResponse(
            success=verified,
            data=response_data,
            message="Fingerprint verification successful" if verified else "Fingerprint verification failed"
        )
    except Exception as e:
        print(f"❌ Fingerprint verification error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/stats")
async def get_stats():
    """Get mock service statistics"""
    return {
        "face_registrations": len(face_encodings),
        "fingerprint_registrations": len(fingerprint_templates),
        "service_uptime": "mock",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/reset")
async def reset_data():
    """Reset all mock data"""
    face_encodings.clear()
    fingerprint_templates.clear()
    return {"message": "All mock data reset", "face_count": 0, "fingerprint_count": 0}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Complete Mock Biometric Service on http://localhost:8000")
    print("📋 Available endpoints:")
    print("   GET  /api/health")
    print("   POST /api/face/register")
    print("   POST /api/face/verify") 
    print("   POST /api/fingerprint/register")
    print("   POST /api/fingerprint/verify")
    print("   GET  /api/stats")
    print("   GET  /api/reset")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("📖 ReDoc: http://localhost:8000/redoc")
    # When invoking via `python complete_mock_service.py` we must not use
    # reload=True because uvicorn expects an import string for reload/workers.
    # Use reload=False when running programmatically.
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
