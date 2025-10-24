"""
Biometric Verification Service
FastAPI application for face recognition and fingerprint authentication.
"""
import os
import numpy as np
import asyncio
from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from models import (
    FaceRegisterRequest,
    FaceAuthenticateRequest,
    FaceQualityCheckRequest,
    FaceRegisterResponse,
    FaceAuthenticateResponse,
    FaceQualityCheckResponse,
    FingerprintRegisterRequest,
    FingerprintAuthenticateRequest,
    FingerprintResponse,
    HealthResponse
)
from utils import (
    check_quality,
    get_quality_feedback,
    encode_face,
    compare_faces,
    get_match_confidence,
    decode_base64_image,
    validate_encoding
)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure data directories exist
FACES_DIR = os.path.join(os.path.dirname(__file__), settings.FACES_DIR)
FINGERPRINTS_DIR = os.path.join(os.path.dirname(__file__), settings.FINGERPRINTS_DIR)
os.makedirs(FACES_DIR, exist_ok=True)
os.makedirs(FINGERPRINTS_DIR, exist_ok=True)


# ============================================================================
# FACE RECOGNITION ENDPOINTS
# ============================================================================

@app.post("/face/register", response_model=FaceRegisterResponse)
async def register_face(data: FaceRegisterRequest):
    """
    Register a user's face by capturing and storing their face encoding.
    
    Steps:
    1. Decode base64 image
    2. Check image quality (blur, brightness, face count)
    3. Generate face encoding (128-D embedding)
    4. Store encoding as .npy file
    
    Returns:
        FaceRegisterResponse with success status and metrics
    """
    try:
        # Decode the image
        img = decode_base64_image(data.imageBase64)
        
        # Check quality
        passed, reasons, metrics = check_quality(img)
        
        if not passed:
            feedback = get_quality_feedback(metrics)
            return FaceRegisterResponse(
                success=False,
                message="Image quality check failed",
                reasons=reasons,
                metrics=metrics,
                feedback=feedback
            )
        
        # Encode face
        encoding = encode_face(img)
        
        if encoding is None:
            return FaceRegisterResponse(
                success=False,
                message="Failed to detect face in image",
                reasons=["No face encoding could be generated"],
                metrics=metrics
            )
        
        # Validate encoding
        if not validate_encoding(encoding):
            return FaceRegisterResponse(
                success=False,
                message="Invalid face encoding generated",
                reasons=["Face encoding validation failed"],
                metrics=metrics
            )
        
        # Save encoding
        file_path = os.path.join(FACES_DIR, f"{data.user_id}.npy")
        np.save(file_path, encoding)
        
        # Generate feedback
        feedback = get_quality_feedback(metrics)
        if not feedback:
            feedback = ["✅ Perfect! Face registered successfully"]
        
        return FaceRegisterResponse(
            success=True,
            message="Face registered successfully",
            embedding_shape=list(encoding.shape),
            metrics=metrics,
            feedback=feedback
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@app.post("/face/authenticate", response_model=FaceAuthenticateResponse)
async def authenticate_face(data: FaceAuthenticateRequest):
    """
    Authenticate a user by comparing their face with stored encoding.
    
    Steps:
    1. Decode base64 image
    2. Generate face encoding from new image
    3. Load stored encoding
    4. Compare encodings using Euclidean distance
    5. Return match result and confidence score
    
    Returns:
        FaceAuthenticateResponse with match status and score
    """
    try:
        # Check if user has registered face
        file_path = os.path.join(FACES_DIR, f"{data.user_id}.npy")
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No face registration found for user: {data.user_id}"
            )
        
        # Decode the image
        img = decode_base64_image(data.imageBase64)
        
        # Check basic quality (more lenient for authentication)
        passed, reasons, metrics = check_quality(
            img, 
            min_blur=80,  # More lenient
            min_brightness=40,
            max_brightness=210
        )
        
        # Encode face from new image
        encoding = encode_face(img)
        
        if encoding is None:
            return FaceAuthenticateResponse(
                success=False,
                match=False,
                score=1.0,
                confidence="none",
                message="No face detected in image",
                metrics=metrics
            )
        
        # Load stored encoding
        stored_encoding = np.load(file_path)
        
        # Compare faces with configured or request tolerance
        tolerance = data.tolerance if data.tolerance else settings.FACE_MATCH_TOLERANCE
        is_match, distance = compare_faces(
            stored_encoding, 
            encoding, 
            tolerance=tolerance
        )
        
        # Get confidence level
        confidence = get_match_confidence(distance)
        
        # Prepare message
        if is_match:
            message = f"Authentication successful (confidence: {confidence})"
        else:
            message = f"Authentication failed - face does not match (distance: {distance:.3f})"
        
        return FaceAuthenticateResponse(
            success=True,
            match=is_match,
            score=distance,
            confidence=confidence,
            message=message,
            metrics=metrics
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@app.post("/face/quality-check", response_model=FaceQualityCheckResponse)
async def quality_check(data: FaceQualityCheckRequest):
    """
    Check the quality of a face image without registering.
    Useful for providing real-time feedback during capture.
    
    Returns:
        FaceQualityCheckResponse with quality metrics and feedback
    """
    try:
        # Decode the image
        img = decode_base64_image(data.imageBase64)
        
        # Check quality
        passed, reasons, metrics = check_quality(img)
        
        # Get feedback
        feedback = get_quality_feedback(metrics)
        
        if passed and not feedback:
            feedback = ["✅ Image quality is excellent!"]
        
        return FaceQualityCheckResponse(
            passed=passed,
            reasons=reasons if reasons else [],
            metrics=metrics,
            feedback=feedback
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quality check failed: {str(e)}"
        )


# ============================================================================
# FINGERPRINT ENDPOINTS (Simulation)
# ============================================================================

@app.post("/fingerprint/register", response_model=FingerprintResponse)
async def register_fingerprint(data: FingerprintRegisterRequest):
    """
    Register fingerprint (simulation for local testing).
    In production, this would coordinate with WebAuthn on the backend.
    
    Returns:
        FingerprintResponse with registration status
    """
    try:
        # Simulate fingerprint scanning process
        await asyncio.sleep(0.5)  # Simulate sensor initialization
        
        # Create a simulated fingerprint record
        file_path = os.path.join(FINGERPRINTS_DIR, f"{data.user_id}.txt")
        
        with open(file_path, 'w') as f:
            f.write(f"Fingerprint registered at: {datetime.now().isoformat()}\n")
            if data.fingerprint_data:
                f.write(f"Data: {data.fingerprint_data}\n")
        
        return FingerprintResponse(
            success=True,
            status="registered",
            message="Fingerprint registered successfully",
            progress=100
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fingerprint registration failed: {str(e)}"
        )


@app.post("/fingerprint/authenticate", response_model=FingerprintResponse)
async def authenticate_fingerprint(data: FingerprintAuthenticateRequest):
    """
    Authenticate fingerprint (simulation for local testing).
    In production, this would verify WebAuthn credentials.
    
    Returns:
        FingerprintResponse with authentication status
    """
    try:
        # Check if fingerprint exists
        file_path = os.path.join(FINGERPRINTS_DIR, f"{data.user_id}.txt")
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No fingerprint registration found for user: {data.user_id}"
            )
        
        # Simulate fingerprint scanning with progress
        await asyncio.sleep(0.3)  # Simulate sensor reading
        
        # In a real system, you would verify the fingerprint data here
        # For simulation, we just check that the file exists
        
        return FingerprintResponse(
            success=True,
            status="authenticated",
            message="Fingerprint authentication successful",
            progress=100
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fingerprint authentication failed: {str(e)}"
        )


@app.get("/fingerprint/simulate")
async def simulate_fingerprint_scan():
    """
    Simulate a fingerprint scan with progress updates.
    Returns ASCII art representation of scanning process.
    """
    # Simple ASCII fingerprint animation
    fingerprint_ascii = r"""
    Scanning fingerprint...
    
       ═══════════════
      ═ ─ ─ ─ ─ ─ ─ ─ ═
     ═ ─ ─ ─ ─ ─ ─ ─ ─ ═
    ═ ─ ─ ─ ─ ╳ ─ ─ ─ ─ ═
     ═ ─ ─ ─ ─ ─ ─ ─ ─ ═
      ═ ─ ─ ─ ─ ─ ─ ─ ═
       ═══════════════
    
    Place finger on sensor...
    """
    
    return {
        "status": "scanning",
        "animation": fingerprint_ascii,
        "progress": 0,
        "message": "Place your finger on the sensor"
    }


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@app.delete("/face/delete/{user_id}")
async def delete_face_registration(user_id: str):
    """
    Delete a user's face registration.
    Useful for re-registration or account deletion.
    """
    try:
        file_path = os.path.join(FACES_DIR, f"{user_id}.npy")
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No face registration found for user: {user_id}"
            )
        
        os.remove(file_path)
        
        return {
            "success": True,
            "message": f"Face registration deleted for user: {user_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete registration: {str(e)}"
        )


@app.delete("/fingerprint/delete/{user_id}")
async def delete_fingerprint_registration(user_id: str):
    """Delete a user's fingerprint registration."""
    try:
        file_path = os.path.join(FINGERPRINTS_DIR, f"{user_id}.txt")
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No fingerprint registration found for user: {user_id}"
            )
        
        os.remove(file_path)
        
        return {
            "success": True,
            "message": f"Fingerprint registration deleted for user: {user_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete registration: {str(e)}"
        )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for monitoring service status.
    """
    import cv2
    import face_recognition
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={
            "opencv": cv2.__version__,
            "face_recognition": face_recognition.__version__,
            "numpy": np.__version__
        }
    )


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Biometric Verification Service",
        "version": "1.0.0",
        "endpoints": {
            "face": {
                "register": "/face/register",
                "authenticate": "/face/authenticate",
                "quality_check": "/face/quality-check",
                "delete": "/face/delete/{user_id}"
            },
            "fingerprint": {
                "register": "/fingerprint/register",
                "authenticate": "/fingerprint/authenticate",
                "simulate": "/fingerprint/simulate",
                "delete": "/fingerprint/delete/{user_id}"
            },
            "utility": {
                "health": "/health",
                "docs": "/docs",
                "redoc": "/redoc"
            }
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )
