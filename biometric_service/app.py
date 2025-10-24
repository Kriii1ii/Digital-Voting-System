"""
Biometric Verification Service API
FastAPI-based service for face and fingerprint authentication.
"""
import os
import asyncio
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import logging

from models.user_faces import (
    FaceRegistrationRequest,
    FaceAuthenticationRequest,
    FaceQualityCheckRequest,
    FaceRegistrationResponse,
    FaceAuthenticationResponse,
    FaceQualityCheckResponse,
    FingerprintRegistrationRequest,
    FingerprintAuthenticationRequest,
    FingerprintResponse,
    HealthResponse
)
from utils.quality_check import check_quality, get_quality_metrics
from utils.face_utils import (
    decode_base64_image,
    get_face_encoding,
    compare_faces
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Biometric Verification Service",
    description="Face and fingerprint authentication API for digital voting system",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure data directory exists
DATA_DIR = "data/faces"
os.makedirs(DATA_DIR, exist_ok=True)

# Constants
FACE_MATCH_TOLERANCE = 0.45
MIN_BLUR_SCORE = 100
MIN_BRIGHTNESS = 50
MAX_BRIGHTNESS = 200


@app.get("/", response_model=dict)
async def root():
    """Root endpoint."""
    return {
        "service": "Biometric Verification Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "face_register": "/face/register",
            "face_authenticate": "/face/authenticate",
            "face_quality_check": "/face/quality-check",
            "fingerprint_register": "/fingerprint/register",
            "fingerprint_authenticate": "/fingerprint/authenticate",
            "fingerprint_simulate": "/fingerprint/simulate"
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        service="Biometric Verification Service",
        version="1.0.0"
    )


@app.post("/face/register", response_model=FaceRegistrationResponse)
async def register_face(data: FaceRegistrationRequest):
    """
    Register a user's face for authentication.
    
    Steps:
    1. Decode base64 image
    2. Check image quality (blur, brightness, face count, head pose)
    3. Extract face encoding
    4. Save encoding to disk
    
    Args:
        data: FaceRegistrationRequest with user_id and imageBase64
    
    Returns:
        FaceRegistrationResponse with success status and details
    """
    try:
        logger.info(f"Face registration request for user: {data.user_id}")
        
        # Decode image
        try:
            img = decode_base64_image(data.imageBase64)
        except ValueError as e:
            logger.error(f"Image decode error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        
        # Check quality
        passed, reasons = check_quality(img)
        if not passed:
            logger.warning(f"Quality check failed for user {data.user_id}: {reasons}")
            return FaceRegistrationResponse(
                success=False,
                message="Image quality check failed",
                reasons=reasons
            )
        
        # Extract face encoding
        encoding = get_face_encoding(img)
        if encoding is None:
            logger.error(f"No face encoding found for user {data.user_id}")
            raise HTTPException(status_code=400, detail="No face detected in image")
        
        # Save encoding
        save_path = os.path.join(DATA_DIR, f"{data.user_id}.npy")
        np.save(save_path, encoding)
        logger.info(f"Face encoding saved for user {data.user_id}")
        
        return FaceRegistrationResponse(
            success=True,
            message="Face registered successfully",
            embedding_shape=[128]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during face registration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/face/authenticate", response_model=FaceAuthenticationResponse)
async def authenticate_face(data: FaceAuthenticationRequest):
    """
    Authenticate a user by comparing their face to stored encoding.
    
    Steps:
    1. Decode base64 image
    2. Extract face encoding
    3. Load stored encoding
    4. Compare encodings
    5. Return match result with distance score
    
    Args:
        data: FaceAuthenticationRequest with user_id and imageBase64
    
    Returns:
        FaceAuthenticationResponse with match status and score
    """
    try:
        logger.info(f"Face authentication request for user: {data.user_id}")
        
        # Decode image
        try:
            img = decode_base64_image(data.imageBase64)
        except ValueError as e:
            logger.error(f"Image decode error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        
        # Extract face encoding
        encoding = get_face_encoding(img)
        if encoding is None:
            logger.error(f"No face detected for user {data.user_id}")
            raise HTTPException(status_code=400, detail="No face detected in image")
        
        # Load stored encoding
        stored_path = os.path.join(DATA_DIR, f"{data.user_id}.npy")
        if not os.path.exists(stored_path):
            logger.warning(f"No registration found for user {data.user_id}")
            raise HTTPException(status_code=404, detail="No face registration found for this user")
        
        stored_encoding = np.load(stored_path)
        
        # Compare faces
        is_match, distance = compare_faces(encoding, stored_encoding, FACE_MATCH_TOLERANCE)
        
        logger.info(f"Face authentication for user {data.user_id}: match={is_match}, score={distance:.4f}")
        
        return FaceAuthenticationResponse(
            success=True,
            match=is_match,
            score=distance,
            message="Authentication successful" if is_match else "Face does not match"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during face authentication: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/face/quality-check", response_model=FaceQualityCheckResponse)
async def quality_check_endpoint(data: FaceQualityCheckRequest):
    """
    Check image quality without saving anything.
    Useful for providing real-time feedback during capture.
    
    Args:
        data: FaceQualityCheckRequest with imageBase64
    
    Returns:
        FaceQualityCheckResponse with quality check results
    """
    try:
        logger.info("Quality check request received")
        
        # Decode image
        try:
            img = decode_base64_image(data.imageBase64)
        except ValueError as e:
            logger.error(f"Image decode error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        
        # Check quality
        passed, reasons = check_quality(img)
        metrics = get_quality_metrics(img)
        
        logger.info(f"Quality check: passed={passed}, reasons={reasons}")
        
        return FaceQualityCheckResponse(
            passed=passed,
            reasons=reasons if not passed else ["All quality checks passed"],
            metrics=metrics
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during quality check: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/fingerprint/register", response_model=FingerprintResponse)
async def register_fingerprint(data: FingerprintRegistrationRequest):
    """
    Register fingerprint (WebAuthn simulation).
    
    In production, this would coordinate with WebAuthn on the client side.
    For now, returns a simulated successful registration.
    
    Args:
        data: FingerprintRegistrationRequest
    
    Returns:
        FingerprintResponse with registration status
    """
    logger.info(f"Fingerprint registration request for user: {data.user_id}")
    
    # Simulate processing delay
    await asyncio.sleep(0.5)
    
    # In production, store WebAuthn credential data
    # For now, just acknowledge registration
    
    return FingerprintResponse(
        success=True,
        message="Fingerprint registered successfully (simulated)",
        status="registered"
    )


@app.post("/fingerprint/authenticate", response_model=FingerprintResponse)
async def authenticate_fingerprint(data: FingerprintAuthenticationRequest):
    """
    Authenticate fingerprint (WebAuthn simulation).
    
    In production, this would verify WebAuthn signature.
    For now, returns a simulated successful authentication.
    
    Args:
        data: FingerprintAuthenticationRequest
    
    Returns:
        FingerprintResponse with authentication status
    """
    logger.info(f"Fingerprint authentication request for user: {data.user_id}")
    
    # Simulate processing delay
    await asyncio.sleep(0.5)
    
    # In production, verify WebAuthn signature
    # For now, just acknowledge authentication
    
    return FingerprintResponse(
        success=True,
        message="Fingerprint authenticated successfully (simulated)",
        status="authenticated"
    )


@app.get("/fingerprint/simulate")
async def simulate_fingerprint_scan():
    """
    Simulate fingerprint scanning with progress updates.
    Returns a stream of progress events.
    
    Returns:
        StreamingResponse with simulated scan progress
    """
    async def generate_scan_progress():
        """Generate simulated fingerprint scan progress."""
        stages = [
            {"progress": 0, "message": "Place finger on sensor"},
            {"progress": 20, "message": "Detecting fingerprint..."},
            {"progress": 40, "message": "Scanning ridges..."},
            {"progress": 60, "message": "Analyzing patterns..."},
            {"progress": 80, "message": "Verifying quality..."},
            {"progress": 100, "message": "Scan complete"}
        ]
        
        for stage in stages:
            yield f"data: {stage}\n\n"
            await asyncio.sleep(0.5)
    
    return StreamingResponse(
        generate_scan_progress(),
        media_type="text/event-stream"
    )


@app.delete("/face/reset/{user_id}")
async def reset_face_registration(user_id: str):
    """
    Delete stored face encoding for a user.
    Allows user to re-register their face.
    
    Args:
        user_id: User identifier
    
    Returns:
        Success message
    """
    logger.info(f"Face reset request for user: {user_id}")
    
    stored_path = os.path.join(DATA_DIR, f"{user_id}.npy")
    
    if not os.path.exists(stored_path):
        raise HTTPException(status_code=404, detail="No face registration found for this user")
    
    try:
        os.remove(stored_path)
        logger.info(f"Face encoding deleted for user {user_id}")
        return {"success": True, "message": "Face registration reset successfully"}
    except Exception as e:
        logger.error(f"Error deleting face encoding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to reset registration: {str(e)}")


@app.get("/face/check-registration/{user_id}")
async def check_registration(user_id: str):
    """
    Check if a user has a face registered.
    
    Args:
        user_id: User identifier
    
    Returns:
        Registration status
    """
    stored_path = os.path.join(DATA_DIR, f"{user_id}.npy")
    exists = os.path.exists(stored_path)
    
    return {
        "user_id": user_id,
        "registered": exists,
        "message": "Face registered" if exists else "No face registration found"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
