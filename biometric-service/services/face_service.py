import face_recognition
import numpy as np
import cv2
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Tuple
import json
from utils.image_utils import ImageUtils
from models.biometric_models import FaceEncoding, VerificationResult, LightingCondition
import uuid

class FaceService:
    def __init__(self):
        # Lowered threshold to accept reasonable matches
        self.quality_threshold = 0.45
        # store encodings by template_id for persistence compatibility
        self.known_face_encodings = {}  # template_id -> encoding
        self.user_to_template = {}      # user_id -> template_id
        self.known_face_metadata = {}

    async def analyze_face_quality(self, image: np.ndarray) -> Dict:
        """Analyze face image quality and return detailed metrics"""
        try:
            # Convert BGR to RGB for face_recognition
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            face_locations = face_recognition.face_locations(rgb_image)
            
            if not face_locations:
                return {
                    'error': 'No face detected',
                    'metrics': {
                        'face_detected': False,
                        'brightness': 0,
                        'contrast': 0,
                        'sharpness': 0,
                        'face_size': 0,
                        'overall_quality': 0
                    }
                }
            
            if len(face_locations) > 1:
                return {
                    'error': 'Multiple faces detected',
                    'metrics': {
                        'face_detected': True,
                        'multiple_faces': True,
                        'face_count': len(face_locations)
                    }
                }
            
            # Get face area
            top, right, bottom, left = face_locations[0]
            face_image = rgb_image[top:bottom, left:right]
            
            # Convert face to grayscale for analysis
            gray_face = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
            
            # Calculate face size ratio
            face_size = (bottom - top) * (right - left) / (image.shape[0] * image.shape[1])
            
            # Calculate metrics
            metrics = {
                'face_detected': True,
                'brightness': float(np.mean(gray_face) / 255.0),
                'contrast': float(np.std(gray_face) / 255.0),
                'sharpness': float(cv2.Laplacian(gray_face, cv2.CV_64F).var() / 1000),  # Normalized
                'face_size': float(face_size),
                'face_position': {
                    'top': int(top),
                    'right': int(right),
                    'bottom': int(bottom),
                    'left': int(left)
                }
            }
            
            # Calculate overall quality score with weights
            metrics['overall_quality'] = float(
                0.3 * metrics['brightness'] +
                0.3 * metrics['contrast'] +
                0.2 * metrics['sharpness'] +
                0.2 * min(1.0, metrics['face_size'] * 4)  # Scale up face size impact
            )
            
            # Add quality thresholds for frontend display
            metrics['thresholds'] = {
                'brightness': (0.2, 0.8),  # Not too dark or bright
                'contrast': 0.3,
                'sharpness': 0.4,
                'face_size': 0.1,
                'overall_quality': 0.6
            }
            
            return {
                'metrics': metrics
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'metrics': None
            }

    async def register_face(self, image: np.ndarray, user_id: str) -> Dict:
        """Register a face from live camera feed with improved quality checks"""
        try:
            # Convert BGR (OpenCV) to RGB (face_recognition)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            # Get face encoding and quality metrics (permissive)
            face_encoding, quality_metrics = await self._process_face_image(rgb_image)

            if face_encoding is None:
                return {
                    'success': False,
                    'user_id': user_id,
                    'error': quality_metrics.get('error', 'Failed to process face') if isinstance(quality_metrics, dict) else 'No face detected',
                    'quality_metrics': quality_metrics
                }

            # Generate a persistent template id and store mapping locally
            template_id = str(uuid.uuid4())
            self.known_face_encodings[template_id] = face_encoding
            self.user_to_template[user_id] = template_id
            self.known_face_metadata[user_id] = {
                'template_id': template_id,
                'quality_metrics': quality_metrics,
                'registered_at': datetime.now().isoformat(),
                'last_verified': None,
                'verification_attempts': 0
            }

            # Return encoding so that the backend may persist it in MongoDB
            return {
                'success': True,
                'user_id': user_id,
                'template_id': template_id,
                'quality_score': quality_metrics.get('overall_quality') if isinstance(quality_metrics, dict) else None,
                'encoding': face_encoding.tolist() if hasattr(face_encoding, 'tolist') else None,
                'face_detected': True,
                'face_count': 1,
                'lighting_conditions': quality_metrics.get('lighting') if isinstance(quality_metrics, dict) else None
            }
        except Exception as e:
            raise Exception(f"Face registration failed: {str(e)}")

    async def _process_face_image(self, image: np.ndarray) -> Tuple[np.ndarray, dict]:
        """Process face image and return encoding with quality metrics"""
        face_locations = face_recognition.face_locations(image)

        if not face_locations:
            return None, {"error": "No face detected"}

        # Use the first detected face (permissive)
        top, right, bottom, left = face_locations[0]
        face_image = image[top:bottom, left:right]

        # Calculate basic quality metrics (informational only)
        try:
            gray = cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY)
        except Exception:
            gray = face_image if face_image.ndim == 2 else cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)

        quality_metrics = {
            'brightness': float(np.mean(gray) / 255.0) if gray.size else 0.0,
            'contrast': float(np.std(gray) / 255.0) if gray.size else 0.0,
            'sharpness': float(cv2.Laplacian(gray, cv2.CV_64F).var()) if gray.size else 0.0,
            'face_size': float((bottom - top) * (right - left) / (image.shape[0] * image.shape[1]))
        }

        quality_metrics['overall_quality'] = float(
            0.3 * quality_metrics['brightness'] +
            0.3 * quality_metrics['contrast'] +
            0.2 * (quality_metrics['sharpness'] / 1000.0) +
            0.2 * quality_metrics['face_size']
        )

        # Do NOT block registration for missing landmarks, slight blur, or lighting;
        # simply attempt to compute an encoding and return it.
        face_encodings = face_recognition.face_encodings(image, face_locations)
        if not face_encodings:
            return None, {**quality_metrics, "error": "Could not encode face"}

        return face_encodings[0], quality_metrics
        
    def _check_quality_thresholds(self, metrics: dict) -> bool:
        """Check if image quality meets minimum thresholds"""
        thresholds = {
            'brightness': (0.2, 0.8),
            'contrast': 0.3,
            'sharpness': 100,
            'face_size': 0.01,
            'overall_quality': 0.5
        }
        
        if not (thresholds['brightness'][0] <= metrics['brightness'] <= thresholds['brightness'][1]):
            return False
        if metrics['contrast'] < thresholds['contrast']:
            return False
        if metrics['sharpness'] < thresholds['sharpness']:
            return False
        if metrics['face_size'] < thresholds['face_size']:
            return False
        if metrics['overall_quality'] < thresholds['overall_quality']:
            return False
        
        return True
        
    async def verify_face(self, image: np.ndarray, user_id: str, reference_encoding: list = None) -> Dict:
        """Verify a face against registered template with quality checks"""
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Process face image (must detect and encode)
            face_encoding, quality_metrics = await self._process_face_image(rgb_image)
            if face_encoding is None:
                return {
                    'success': False,
                    'verified': False,
                    'error': quality_metrics.get('error', 'Failed to process face') if isinstance(quality_metrics, dict) else 'Failed to process face',
                    'face_detected': False,
                    'quality_metrics': quality_metrics,
                    'match_score': 0.0
                }

            # Choose reference encoding: if a reference encoding is provided use it, otherwise prefer a stored user template
            ref_encoding = None
            if reference_encoding:
                ref_encoding = reference_encoding
            else:
                tpl = self.user_to_template.get(user_id)
                if tpl and tpl in self.known_face_encodings:
                    ref_encoding = self.known_face_encodings[tpl]
                elif user_id in self.known_face_encodings:
                    ref_encoding = self.known_face_encodings[user_id]

            if ref_encoding is None:
                # No local template available — cannot compare here
                return {
                    'success': False,
                    'verified': False,
                    'error': 'No reference encoding available for user',
                    'face_detected': True,
                    'quality_metrics': quality_metrics,
                    'match_score': 0.0
                }

            face_distances = face_recognition.face_distance([ref_encoding], face_encoding)
            if len(face_distances) == 0:
                return {
                    'success': False,
                    'verified': False,
                    'error': 'Failed to compare faces',
                    'face_detected': True,
                    'quality_metrics': quality_metrics,
                    'match_score': 0.0
                }

            match_score = float(1 - face_distances[0])

            # Looser acceptance: accept if match_score >= quality_threshold
            is_match = match_score >= self.quality_threshold

            # update metadata if available
            meta = self.known_face_metadata.get(user_id)
            if meta:
                meta['last_verified'] = datetime.now().isoformat()
                meta['verification_attempts'] = meta.get('verification_attempts', 0) + 1
                meta['last_match_score'] = match_score

            return {
                'success': is_match,
                'verified': is_match,
                'user_id': user_id,
                'face_detected': True,
                'quality_metrics': quality_metrics,
                'match_score': match_score,
                'threshold': self.quality_threshold
            }
            
        except Exception as e:
            return {
                'success': False,
                'verified': False,
                'error': str(e),
                'face_detected': False,
                'match_score': 0.0
            }
