import face_recognition
import numpy as np
import cv2
import os
from typing import List, Optional, Tuple

class FaceRecognitionModel:
    def __init__(self):
        self.model_loaded = False
        self.known_face_encodings = {}
        self.known_face_users = {}

    def load_models(self):
        """Load face recognition models"""
        try:
            # face_recognition library automatically loads models on first use
            # This is just a placeholder for any custom model loading
            self.model_loaded = True
            print("Face recognition models ready")
        except Exception as e:
            print(f"Error loading face recognition models: {e}")
            raise

    def encode_face(self, image: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[dict]]:
        """Encode face from image and return quality metrics"""
        try:
            # Convert BGR to RGB if needed
            if len(image.shape) == 3 and image.shape[2] == 3:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = image

            # Detect faces
            face_locations = face_recognition.face_locations(rgb_image)
            
            if not face_locations:
                return None, {"error": "No face detected"}
            
            if len(face_locations) > 1:
                return None, {"error": "Multiple faces detected"}
            
            # Get face location
            top, right, bottom, left = face_locations[0]
            
            # Extract face ROI
            face_image = rgb_image[top:bottom, left:right]
            
            # Calculate quality metrics
            quality_metrics = self._calculate_face_quality(face_image)
            
            if not self._check_quality_threshold(quality_metrics):
                return None, {**quality_metrics, "error": "Face quality too low"}
            
            # Get face encoding
            face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
            
            if not face_encodings:
                return None, {"error": "Could not encode face"}
            
            return face_encodings[0], quality_metrics
            
        except Exception as e:
            print(f"Error encoding face: {e}")
            return None, {"error": str(e)}
            
    def _calculate_face_quality(self, face_image: np.ndarray) -> dict:
        """Calculate quality metrics for face image"""
        metrics = {}
        
        # Calculate brightness
        metrics['brightness'] = np.mean(face_image) / 255.0
        
        # Calculate contrast using standard deviation
        metrics['contrast'] = np.std(face_image) / 255.0
        
        # Calculate sharpness using Laplacian
        gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
        metrics['sharpness'] = cv2.Laplacian(gray, cv2.CV_64F).var() / 10000  # Normalized
        
        # Calculate face size ratio
        face_size = face_image.shape[0] * face_image.shape[1]
        metrics['size_ratio'] = face_size / (face_image.shape[0] * face_image.shape[1])
        
        # Overall quality score (weighted average)
        metrics['quality_score'] = (
            0.3 * metrics['brightness'] +
            0.3 * metrics['contrast'] +
            0.2 * metrics['sharpness'] +
            0.2 * metrics['size_ratio']
        )
        
        return metrics
        
    def _check_quality_threshold(self, metrics: dict) -> bool:
        """Check if face quality meets minimum thresholds"""
        thresholds = {
            'brightness': (0.2, 0.8),  # Not too dark or bright
            'contrast': 0.3,           # Minimum contrast
            'sharpness': 0.4,          # Minimum sharpness
            'size_ratio': 0.1,         # Minimum face size ratio
            'quality_score': 0.5       # Minimum overall quality
        }
        
        if not (thresholds['brightness'][0] <= metrics['brightness'] <= thresholds['brightness'][1]):
            return False
            
        if metrics['contrast'] < thresholds['contrast']:
            return False
            
        if metrics['sharpness'] < thresholds['sharpness']:
            return False
            
        if metrics['size_ratio'] < thresholds['size_ratio']:
            return False
            
        if metrics['quality_score'] < thresholds['quality_score']:
            return False
            
        return True

    def register_face(self, user_id: str, face_encoding: np.ndarray):
        """Register a face encoding for a user"""
        self.known_face_encodings[user_id] = face_encoding
        self.known_face_users[user_id] = user_id

    def verify_face(self, face_encoding: np.ndarray, user_id: str, threshold: float = 0.6) -> Tuple[bool, float]:
        """Verify face against registered encoding"""
        if user_id not in self.known_face_encodings:
            return False, 0.0
        
        registered_encoding = self.known_face_encodings[user_id]
        
        # Calculate face distance
        face_distances = face_recognition.face_distance([registered_encoding], face_encoding)
        
        if len(face_distances) == 0:
            return False, 0.0
            
        # Convert distance to similarity score (1 - distance)
        similarity = 1 - face_distances[0]
        
        # Check if similarity exceeds threshold
        is_match = similarity >= (1 - threshold)
        
        return is_match, float(similarity)
        
        # Calculate face distance
        face_distance = face_recognition.face_distance([registered_encoding], face_encoding)[0]
        confidence = 1 - face_distance
        
        verified = face_distance < threshold
        
        return verified, confidence

    def find_similar_faces(self, face_encoding: np.ndarray, threshold: float = 0.6) -> List[Tuple[str, float]]:
        """Find similar faces in the database"""
        matches = []
        
        for user_id, known_encoding in self.known_face_encodings.items():
            face_distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
            confidence = 1 - face_distance
            
            if face_distance < threshold:
                matches.append((user_id, confidence))
        
        # Sort by confidence (highest first)
        matches.sort(key=lambda x: x[1], reverse=True)
        
        return matches

    def get_face_quality(self, image: np.ndarray, face_location: Tuple) -> float:
        """Calculate face image quality score"""
        try:
            top, right, bottom, left = face_location
            face_image = image[top:bottom, left:right]
            
            if face_image.size == 0:
                return 0.0
            
            # Convert to grayscale for analysis
            gray_face = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
            
            # Calculate brightness (0-255, ideal around 127)
            brightness = np.mean(gray_face)
            brightness_score = 1 - abs(brightness - 127) / 127
            
            # Calculate sharpness (variance of Laplacian)
            sharpness = cv2.Laplacian(gray_face, cv2.CV_64F).var()
            sharpness_score = min(sharpness / 1000.0, 1.0)  # Normalize
            
            # Calculate contrast (standard deviation)
            contrast = np.std(gray_face)
            contrast_score = min(contrast / 100.0, 1.0)  # Normalize
            
            # Combined quality score
            quality = (brightness_score * 0.3 + sharpness_score * 0.4 + contrast_score * 0.3)
            
            return max(0.0, min(1.0, quality))
            
        except Exception as e:
            print(f"Error calculating face quality: {e}")
            return 0.0

# Global instance
face_model = FaceRecognitionModel()