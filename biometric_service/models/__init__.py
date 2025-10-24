"""Data models for biometric service."""
from .user_faces import (
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

__all__ = [
    'FaceRegisterRequest',
    'FaceAuthenticateRequest',
    'FaceQualityCheckRequest',
    'FaceRegisterResponse',
    'FaceAuthenticateResponse',
    'FaceQualityCheckResponse',
    'FingerprintRegisterRequest',
    'FingerprintAuthenticateRequest',
    'FingerprintResponse',
    'HealthResponse'
]
