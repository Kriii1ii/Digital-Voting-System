"""
Face recognition utilities for encoding and comparing faces.
"""
import numpy as np
import face_recognition
import cv2
import base64
from typing import Tuple, Optional


def decode_base64_image(image_base64: str) -> np.ndarray:
    """
    Decode base64 image string to OpenCV image.
    
    Args:
        image_base64: Base64 encoded image string (may include data URI prefix)
    
    Returns:
        OpenCV image in BGR format
    
    Raises:
        ValueError: If image cannot be decoded
    """
    try:
        # Remove data URI prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[-1]
        
        # Decode base64
        img_bytes = base64.b64decode(image_base64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        return img
    except Exception as e:
        raise ValueError(f"Invalid image format: {str(e)}")


def get_face_encoding(img: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract face encoding from image.
    
    Args:
        img: OpenCV image in BGR format
    
    Returns:
        128-dimensional face encoding array, or None if no face found
    """
    # face_recognition expects RGB
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    encodings = face_recognition.face_encodings(rgb_img)
    if not encodings:
        return None
    
    # Return first encoding
    return encodings[0]


def compare_faces(encoding1: np.ndarray, encoding2: np.ndarray, tolerance: float = 0.45) -> Tuple[bool, float]:
    """
    Compare two face encodings.
    
    Args:
        encoding1: First face encoding
        encoding2: Second face encoding
        tolerance: Maximum distance for a match (default: 0.45)
    
    Returns:
        tuple: (is_match: bool, distance: float)
    """
    distance = np.linalg.norm(encoding1 - encoding2)
    is_match = distance < tolerance
    
    return is_match, float(distance)


def get_face_locations(img: np.ndarray) -> list:
    """
    Detect face locations in image.
    
    Args:
        img: OpenCV image in BGR format
    
    Returns:
        List of face locations as (top, right, bottom, left) tuples
    """
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return face_recognition.face_locations(rgb_img)


def draw_face_box(img: np.ndarray, face_location: tuple, color: tuple = (0, 255, 0), thickness: int = 2) -> np.ndarray:
    """
    Draw a box around a detected face.
    
    Args:
        img: OpenCV image
        face_location: (top, right, bottom, left) tuple
        color: BGR color tuple
        thickness: Line thickness
    
    Returns:
        Image with face box drawn
    """
    top, right, bottom, left = face_location
    cv2.rectangle(img, (left, top), (right, bottom), color, thickness)
    return img
