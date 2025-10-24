"""
Face encoding and comparison utilities.
Handles face embedding generation and authentication matching.
"""
import numpy as np
import face_recognition
import cv2
from typing import Tuple, Optional


def encode_face(img) -> Optional[np.ndarray]:
    """
    Generate face encoding (128-D embedding) from an image.
    
    Args:
        img: OpenCV image in BGR format
    
    Returns:
        numpy.ndarray: 128-D face encoding, or None if no face detected
    """
    # Convert BGR to RGB (face_recognition expects RGB)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Get face encodings
    encodings = face_recognition.face_encodings(rgb_img)
    
    if not encodings:
        return None
    
    # Return the first encoding (we've already validated there's only one face)
    return encodings[0]


def compare_faces(known_encoding: np.ndarray, unknown_encoding: np.ndarray, 
                  tolerance: float = 0.45) -> Tuple[bool, float]:
    """
    Compare two face encodings and determine if they match.
    
    Args:
        known_encoding: The stored face encoding
        unknown_encoding: The new face encoding to compare
        tolerance: Maximum distance for a match (default: 0.45)
    
    Returns:
        tuple: (is_match: bool, distance: float)
    """
    # Calculate Euclidean distance
    distance = np.linalg.norm(known_encoding - unknown_encoding)
    
    # Determine if it's a match
    is_match = distance < tolerance
    
    return is_match, float(distance)


def get_match_confidence(distance: float) -> str:
    """
    Get a confidence level description based on the distance score.
    
    Args:
        distance: The Euclidean distance between face encodings
    
    Returns:
        str: Confidence level description
    """
    if distance < 0.30:
        return "very_high"
    elif distance < 0.40:
        return "high"
    elif distance < 0.45:
        return "medium"
    elif distance < 0.55:
        return "low"
    else:
        return "very_low"


def decode_base64_image(image_base64: str) -> np.ndarray:
    """
    Decode a base64 image string to OpenCV format.
    
    Args:
        image_base64: Base64 encoded image (with or without data URI prefix)
    
    Returns:
        numpy.ndarray: OpenCV image in BGR format
    """
    import base64
    
    # Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[-1]
    
    # Decode base64 to bytes
    img_bytes = base64.b64decode(image_base64)
    
    # Convert to numpy array
    np_arr = np.frombuffer(img_bytes, np.uint8)
    
    # Decode to OpenCV image
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Failed to decode image")
    
    return img


def validate_encoding(encoding: np.ndarray) -> bool:
    """
    Validate that a face encoding is valid.
    
    Args:
        encoding: Face encoding to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    if encoding is None:
        return False
    
    if not isinstance(encoding, np.ndarray):
        return False
    
    if encoding.shape != (128,):
        return False
    
    # Check for NaN or Inf values
    if np.any(np.isnan(encoding)) or np.any(np.isinf(encoding)):
        return False
    
    return True
