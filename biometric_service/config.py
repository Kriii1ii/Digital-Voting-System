"""
Configuration settings for the biometric service.
Load from environment variables or use defaults.
"""
import os
from typing import List


class Settings:
    """Application settings."""
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Face recognition settings
    FACE_MATCH_TOLERANCE: float = float(os.getenv("FACE_MATCH_TOLERANCE", "0.45"))
    MIN_BLUR_SCORE: float = float(os.getenv("MIN_BLUR_SCORE", "100"))
    MIN_BRIGHTNESS: float = float(os.getenv("MIN_BRIGHTNESS", "50"))
    MAX_BRIGHTNESS: float = float(os.getenv("MAX_BRIGHTNESS", "200"))
    
    # Data storage
    DATA_DIR: str = os.getenv("DATA_DIR", "data/faces")
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173,http://localhost:5000"
    ).split(",")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "development-secret-key-change-in-production")
    ENABLE_ENCRYPTION: bool = os.getenv("ENABLE_ENCRYPTION", "false").lower() == "true"


settings = Settings()
