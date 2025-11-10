from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.responses import JSONResponse
import time
import os
from fastapi.middleware.cors import CORSMiddleware
import logging
from services.face_service import register_face, verify_face
from utils.quality_check import perform_quality_check
from utils.image_utils import decode_base64_image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Biometric Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "biometric-service"}

# In-memory rate limiter map: key -> last_request_timestamp (seconds)
# Key is user-provided user_id (if supplied) or the client IP address.
_quality_last_request = {}


@app.post("/api/face/quality-check")
def quality_check_endpoint(request: Request, image: str = Body(..., embed=True), user_id: str = Body(None, embed=True)):
    """
    Perform strict quality check on a face image.
    Returns: { passed: bool, message: str, details: dict }
    """
    try:
        # Rate limiting: allow one request per KEY every 2 seconds by default
        key = (user_id or request.headers.get('X-User-Id') or request.client.host)
        now = time.time()
        min_interval = float(os.getenv('QUALITY_CHECK_MIN_INTERVAL_SEC', 2.0))
        last = _quality_last_request.get(key)
        # cleanup stale entries older than 60s to avoid unbounded growth
        stale_threshold = now - 60.0
        for k, t in list(_quality_last_request.items()):
            if t < stale_threshold:
                _quality_last_request.pop(k, None)

        if last and (now - last) < min_interval:
            retry_after = min_interval - (now - last)
            logger.warning(f"⚠️ Rate limit triggered for user/IP {key}")
            return JSONResponse(status_code=429, content={"error": "Too many requests, slow down.", "retry_after": retry_after})

        # record request timestamp
        _quality_last_request[key] = now

        if not image:
            return {
                "passed": False,
                "message": "No image data provided",
                "details": None
            }
        
        # Decode image
        try:
            img = decode_base64_image(image)
        except Exception as e:
            logger.error(f"Image decode error: {str(e)}")
            return {
                "passed": False,
                "message": "Invalid image format",
                "details": None
            }
        
        # Perform quality check
        result = perform_quality_check(img)

        # determine a simple quality label to help the client stop polling
        details = result.get("details") or {}
        face_detected = bool(result.get("face_detected", False))
        passed = bool(result.get("passed", False))
        # Use confidence or score heuristics if available
        confidence = None
        for k in ("confidence", "detection_confidence", "score"):
            if k in details and isinstance(details[k], (int, float)):
                confidence = float(details[k])
                break

        quality = "unknown"
        # If explicit passed flag is true, treat as good
        if passed and face_detected:
            quality = "good"
        elif confidence is not None and confidence >= float(os.getenv('QUALITY_GOOD_CONFIDENCE', 0.5)):
            quality = "good"
        else:
            quality = "poor"

        # Log when quality is good (useful for debugging and client-side stopping)
        if quality == "good":
            logger.info(f"✅ Face quality good — stopping checks for {key}")

        return {
            "passed": passed,
            "quality": quality,
            "message": result.get("message", "Quality check complete"),
            "details": details,
            "face_detected": face_detected,
            "confidence": confidence
        }
    except Exception as e:
        logger.error(f"Quality check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/face/register")
def register_endpoint(user_id: str = Body(..., embed=True), image_data: str = Body(..., embed=True)):
    """
    Register a face for a user.
    Returns: { success: bool, face_id: str, encoding: list, message: str }
    """
    try:
        if not user_id or not image_data:
            return {
                "success": False,
                "message": "Missing user_id or image_data",
                "face_id": None,
                "encoding": None
            }
        
        # Decode image
        try:
            img = decode_base64_image(image_data)
        except Exception as e:
            logger.error(f"Image decode error: {str(e)}")
            return {
                "success": False,
                "message": "Invalid image format",
                "face_id": None,
                "encoding": None
            }
        
        # Register face
        result = register_face(user_id, img)
        
        return {
            "success": result.get("success", False),
            "message": result.get("message", "Registration complete"),
            "face_id": result.get("face_id"),
            "encoding": result.get("encoding"),
            "data": result
        }
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/face/verify")
def verify_endpoint(user_id: str = Body(..., embed=True), image_data: str = Body(..., embed=True), reference_encoding: list = Body(None, embed=True)):
    """
    Verify a face against a stored template.
    Returns: { verified: bool, confidence: float, message: str }
    """
    try:
        if not user_id or not image_data:
            return {
                "verified": False,
                "message": "Missing user_id or image_data",
                "confidence": 0
            }
        
        # Decode image
        try:
            img = decode_base64_image(image_data)
        except Exception as e:
            logger.error(f"Image decode error: {str(e)}")
            return {
                "verified": False,
                "message": "Invalid image format",
                "confidence": 0
            }
        
        # Verify face
        result = verify_face(user_id, img, reference_encoding)
        
        return {
            "verified": result.get("verified", False),
            "message": result.get("message", "Verification complete"),
            "confidence": result.get("confidence", 0),
            "data": result
        }
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/face/validate")
def validate_endpoint(image: str = Body(..., embed=True)):
    """
    Validate face presence and basic quality.
    Returns: { success: bool, face_detected: bool, details: dict }
    """
    try:
        if not image:
            return {
                "success": False,
                "face_detected": False,
                "details": None,
                "message": "No image data"
            }
        
        # Decode image
        try:
            img = decode_base64_image(image)
        except Exception as e:
            logger.error(f"Image decode error: {str(e)}")
            return {
                "success": False,
                "face_detected": False,
                "details": None,
                "message": "Invalid image format"
            }
        
        # Perform quality check
        result = perform_quality_check(img)
        
        return {
            "success": result.get("face_detected", False),
            "face_detected": result.get("face_detected", False),
            "details": result.get("details", {}),
            "message": result.get("message", "Validation complete")
        }
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/biometrics/face/exists/{user_id}")
def face_exists_endpoint(user_id: str):
    """
    Check if a face template exists for a user.
    Returns: { exists: bool }
    """
    try:
        from services.database import face_exists
        exists = face_exists(user_id)
        return {"exists": exists}
    except Exception as e:
        logger.error(f"Face exists check error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Face exists check failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)