"""Utility modules for biometric service."""
from .quality_check import check_quality, get_quality_feedback
from .face_utils import (
    encode_face,
    compare_faces,
    get_match_confidence,
    decode_base64_image,
    validate_encoding
)

__all__ = [
    'check_quality',
    'get_quality_feedback',
    'encode_face',
    'compare_faces',
    'get_match_confidence',
    'decode_base64_image',
    'validate_encoding'
]
