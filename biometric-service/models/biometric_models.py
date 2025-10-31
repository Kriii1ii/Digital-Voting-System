from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum
import numpy as np

class BiometricType(str, Enum):
    FACE = "face"
    FINGERPRINT = "fingerprint"
    BOTH = "both"

class SensorType(str, Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    TOUCH_ID = "touch_id"
    FACE_ID = "face_id"
    WINDOWS_HELLO = "windows_hello"
    WEBAUTHN = "webauthn"
    SIMULATED = "simulated"

class FaceRegistrationRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    image_data: str = Field(..., description="Base64 encoded image data")

class FingerprintRegistrationRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    sensor_data: Dict[str, Any] = Field(..., description="Sensor-specific fingerprint data")

class VerificationRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    image_data: Optional[str] = Field(None, description="Base64 encoded face image data")
    sensor_data: Optional[Dict[str, Any]] = Field(None, description="Sensor-specific fingerprint data")

class BiometricResponse(BaseModel):
    success: bool = Field(..., description="Operation success status")
    data: Dict[str, Any] = Field(default_factory=dict, description="Response data")
    message: str = Field(..., description="Response message")

class FaceEncoding(BaseModel):
    user_id: str
    encoding: List[float]
    quality_score: float = Field(ge=0.0, le=1.0)
    face_location: List[int]  # [top, right, bottom, left]
    created_at: str
    lighting_conditions: Dict[str, float]

class FingerprintTemplate(BaseModel):
    user_id: str
    template: Dict[str, Any]
    sensor_type: SensorType
    quality_score: float = Field(ge=0.0, le=1.0)
    minutiae_count: int
    created_at: str

class VerificationResult(BaseModel):
    verified: bool
    confidence: float = Field(ge=0.0, le=1.0)
    threshold: float = Field(ge=0.0, le=1.0)
    message: str
    face_detected: Optional[bool] = None
    lighting_condition: Optional[str] = None
    lighting_metrics: Optional[Dict[str, float]] = None
    sensor_type: Optional[SensorType] = None
    quality: Optional[float] = None

class ImageQualityMetrics(BaseModel):
    brightness: float = Field(ge=0.0, le=255.0)
    contrast: float = Field(ge=0.0)
    sharpness: float = Field(ge=0.0)
    size_ratio: float = Field(ge=0.0, le=1.0)
    face_area: int

class LightingCondition(str, Enum):
    LOW_LIGHT = "low_light"
    OVEREXPOSED = "overexposed"
    BLURRY = "blurry"
    GOOD = "good"

class ErrorResponse(BaseModel):
    success: bool = Field(False)
    error: str
    detail: Optional[str] = None
    timestamp: str