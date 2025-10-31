"""
Mock FastAPI service for testing integration
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
from datetime import datetime

app = FastAPI(title="Mock Biometric Service")

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

# Mock storage
mock_face_encodings = {}

@app.post("/api/face/register", response_model=BiometricResponse)
async def register_face(request: FaceRegistrationRequest):
    """Mock face registration"""
    try:
        # Simulate processing
        quality_score = round(random.uniform(0.7, 0.95), 2)
        
        # Store mock encoding
        mock_face_encodings[request.user_id] = {
            "encoding": [random.random() for _ in range(128)],
            "quality_score": quality_score,
            "registered_at": datetime.now().isoformat()
        }
        
        return BiometricResponse(
            success=True,
            data={
                "user_id": request.user_id,
                "quality_score": quality_score,
                "face_detected": True,
                "encoding_length": 128
            },
            message="Face registered successfully (mock)"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/face/verify", response_model=BiometricResponse)
async def verify_face(request: FaceRegistrationRequest):
    """Mock face verification"""
    try:
        if request.user_id not in mock_face_encodings:
            return BiometricResponse(
                success=False,
                data={},
                message="User face not registered"
            )
        
        # Simulate verification with 80% success rate
        verified = random.random() > 0.2
        confidence = round(random.uniform(0.6, 0.95), 2) if verified else round(random.uniform(0.3, 0.5), 2)
        
        return BiometricResponse(
            success=verified,
            data={
                "verified": verified,
                "confidence": confidence,
                "threshold": 0.6,
                "face_detected": True
            },
            message="Face verification successful" if verified else "Face verification failed"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Fingerprint endpoints removed from mock — service is face-only

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "mock-biometric", "timestamp": datetime.now().isoformat()}

@app.get("/api/reset")
async def reset_mock_data():
    """Reset mock data for testing"""
    mock_face_encodings.clear()
    return {"message": "Mock data reset", "face_count": 0}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Mock Biometric Service on http://localhost:8000")
    print("💡 This is a mock service for testing integration")
    uvicorn.run(app, host="0.0.0.0", port=8000)
