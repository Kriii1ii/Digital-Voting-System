"""
Configuration settings for the Biometric Verification Service.
Override these by setting environment variables.
"""
import os
from typing import List


class Settings:
    """Application settings"""
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    RELOAD: bool = os.getenv("RELOAD", "true").lower() == "true"
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:8080"
    ).split(",")
    
    # Face Recognition Settings
    FACE_MATCH_TOLERANCE: float = float(os.getenv("FACE_MATCH_TOLERANCE", "0.45"))
    MIN_BLUR_SCORE: float = float(os.getenv("MIN_BLUR_SCORE", "100"))
    MIN_BRIGHTNESS: float = float(os.getenv("MIN_BRIGHTNESS", "50"))
    MAX_BRIGHTNESS: float = float(os.getenv("MAX_BRIGHTNESS", "200"))
    
    # Security
    API_KEY: str = os.getenv("API_KEY", None)  # Set this in production
    ENABLE_API_KEY_AUTH: bool = API_KEY is not None
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info").upper()
    
    # Data Storage
    FACES_DIR: str = os.getenv("FACES_DIR", "data/faces")
    FINGERPRINTS_DIR: str = os.getenv("FINGERPRINTS_DIR", "data/fingerprints")
    
    # Database (for future use)
    DATABASE_URL: str = os.getenv("DATABASE_URL", None)
    
    # Application Info
    APP_TITLE: str = "Biometric Verification Service"
    APP_DESCRIPTION: str = "Face recognition and fingerprint authentication API for digital voting system"
    APP_VERSION: str = "1.0.0"
    
    # Rate Limiting (if enabled)
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "false").lower() == "true"
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))
    
    @classmethod
    def get_face_quality_params(cls):
        """Get face quality check parameters"""
        return {
            "min_blur": cls.MIN_BLUR_SCORE,
            "min_brightness": cls.MIN_BRIGHTNESS,
            "max_brightness": cls.MAX_BRIGHTNESS
        }


# Create singleton instance
settings = Settings()


# Validation
def validate_settings():
    """Validate configuration settings"""
    errors = []
    
    if settings.FACE_MATCH_TOLERANCE < 0 or settings.FACE_MATCH_TOLERANCE > 1:
        errors.append("FACE_MATCH_TOLERANCE must be between 0 and 1")
    
    if settings.MIN_BLUR_SCORE < 0:
        errors.append("MIN_BLUR_SCORE must be positive")
    
    if settings.MIN_BRIGHTNESS < 0 or settings.MIN_BRIGHTNESS > 255:
        errors.append("MIN_BRIGHTNESS must be between 0 and 255")
    
    if settings.MAX_BRIGHTNESS < 0 or settings.MAX_BRIGHTNESS > 255:
        errors.append("MAX_BRIGHTNESS must be between 0 and 255")
    
    if settings.MIN_BRIGHTNESS >= settings.MAX_BRIGHTNESS:
        errors.append("MIN_BRIGHTNESS must be less than MAX_BRIGHTNESS")
    
    if errors:
        raise ValueError("Configuration errors:\n" + "\n".join(f"  - {err}" for err in errors))
    
    return True


# Run validation on import
validate_settings()
