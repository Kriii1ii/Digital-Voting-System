"""
Data models for face recognition API requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class FaceRegisterRequest(BaseModel):
    """Request model for face registration."""
    user_id: str = Field(..., description="Unique identifier for the user")
    imageBase64: str = Field(..., description="Base64 encoded image data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }


class FaceAuthenticateRequest(BaseModel):
    """Request model for face authentication."""
    user_id: str = Field(..., description="Unique identifier for the user")
    imageBase64: str = Field(..., description="Base64 encoded image data")
    tolerance: Optional[float] = Field(0.45, description="Match tolerance (lower is stricter)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
                "tolerance": 0.45
            }
        }


class FaceQualityCheckRequest(BaseModel):
    """Request model for face quality check."""
    imageBase64: str = Field(..., description="Base64 encoded image data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }


class FaceRegisterResponse(BaseModel):
    """Response model for face registration."""
    success: bool
    message: str
    embedding_shape: Optional[List[int]] = None
    metrics: Optional[Dict[str, Any]] = None
    reasons: Optional[List[str]] = None
    feedback: Optional[List[str]] = None


class FaceAuthenticateResponse(BaseModel):
    """Response model for face authentication."""
    success: bool
    match: bool
    score: float
    confidence: str
    message: str
    metrics: Optional[Dict[str, Any]] = None


class FaceQualityCheckResponse(BaseModel):
    """Response model for face quality check."""
    passed: bool
    reasons: List[str]
    metrics: Dict[str, Any]
    feedback: List[str]


class FingerprintRegisterRequest(BaseModel):
    """Request model for fingerprint registration (simulation)."""
    user_id: str = Field(..., description="Unique identifier for the user")
    fingerprint_data: Optional[str] = Field(None, description="Simulated fingerprint data or WebAuthn credential")


class FingerprintAuthenticateRequest(BaseModel):
    """Request model for fingerprint authentication (simulation)."""
    user_id: str = Field(..., description="Unique identifier for the user")
    fingerprint_data: Optional[str] = Field(None, description="Simulated fingerprint data or WebAuthn credential")


class FingerprintResponse(BaseModel):
    """Response model for fingerprint operations."""
    success: bool
    status: str
    message: str
    progress: Optional[int] = None


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    version: str
    services: Dict[str, str]
