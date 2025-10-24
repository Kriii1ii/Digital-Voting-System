"""
Data models for face recognition requests and responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List


class FaceRegistrationRequest(BaseModel):
    """Request model for face registration."""
    user_id: str = Field(..., description="Unique user identifier")
    imageBase64: str = Field(..., description="Base64 encoded image")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }


class FaceAuthenticationRequest(BaseModel):
    """Request model for face authentication."""
    user_id: str = Field(..., description="Unique user identifier")
    imageBase64: str = Field(..., description="Base64 encoded image")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }


class FaceQualityCheckRequest(BaseModel):
    """Request model for face quality check."""
    imageBase64: str = Field(..., description="Base64 encoded image")
    
    class Config:
        json_schema_extra = {
            "example": {
                "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }


class FaceRegistrationResponse(BaseModel):
    """Response model for face registration."""
    success: bool
    message: str
    embedding_shape: Optional[List[int]] = None
    reasons: Optional[List[str]] = None


class FaceAuthenticationResponse(BaseModel):
    """Response model for face authentication."""
    success: bool
    match: bool
    score: float
    message: Optional[str] = None


class FaceQualityCheckResponse(BaseModel):
    """Response model for face quality check."""
    passed: bool
    reasons: List[str]
    metrics: Optional[dict] = None


class FingerprintRegistrationRequest(BaseModel):
    """Request model for fingerprint registration (WebAuthn)."""
    user_id: str = Field(..., description="Unique user identifier")
    challenge: Optional[str] = Field(None, description="WebAuthn challenge")
    credential_id: Optional[str] = Field(None, description="Credential ID")
    public_key: Optional[str] = Field(None, description="Public key")


class FingerprintAuthenticationRequest(BaseModel):
    """Request model for fingerprint authentication (WebAuthn)."""
    user_id: str = Field(..., description="Unique user identifier")
    challenge: Optional[str] = Field(None, description="WebAuthn challenge")
    signature: Optional[str] = Field(None, description="Authentication signature")


class FingerprintResponse(BaseModel):
    """Response model for fingerprint operations."""
    success: bool
    message: str
    status: Optional[str] = None
    progress: Optional[int] = None


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    service: str
    version: str
