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
        self.quality_threshold = 0.6
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
            
            # Get face encoding and quality metrics
            face_encoding, quality_metrics = await self._process_face_image(rgb_image)
            
            if face_encoding is None:
                return {
                    'success': False,
                    'user_id': user_id,
                    'error': quality_metrics.get('error', 'Failed to process face'),
                    'quality_metrics': quality_metrics
                }
            
            # Generate a persistent template id and store mapping
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

            return {
                'success': True,
                'user_id': user_id,
                'template_id': template_id,
                'quality_score': quality_metrics['overall_quality'],
                'encoding': face_encoding.tolist() if hasattr(face_encoding, 'tolist') else None,
                'face_detected': True,
                'face_count': 1,
                'lighting_conditions': quality_metrics.get('lighting')
            }
            
        except Exception as e:
            raise Exception(f"Face registration failed: {str(e)}")
        try:
            # Preprocess image
            processed_image = ImageUtils.preprocess_face_image(image)
            
            # Detect faces
            face_locations = face_recognition.face_locations(processed_image)
            face_encodings = face_recognition.face_encodings(processed_image, face_locations)
            
            if len(face_encodings) == 0:
                raise Exception("No face detected in the image")
            
            if len(face_encodings) > 1:
                raise Exception("Multiple faces detected. Please ensure only one face is visible")
            
            # Validate face image quality
            validation_result = ImageUtils.validate_face_image(processed_image, face_locations[0])
            if not validation_result["valid"]:
                raise Exception(f"Face validation failed: {validation_result.get('reason', 'Unknown error')}")
            
            # Calculate face quality using new utility
            quality_score = ImageUtils.calculate_face_quality_score(validation_result)
            
            if quality_score < self.quality_threshold:
                raise Exception(f"Face quality too low: {quality_score:.2f}. Please ensure good lighting and clear face visibility")
            
            # Register face encoding
            face_model.register_face(user_id, face_encodings[0])
            
            # Create face encoding record using Pydantic model
            face_encoding_record = FaceEncoding(
                user_id=user_id,
                encoding=face_encodings[0].tolist(),
                quality_score=quality_score,
                face_location=list(face_locations[0]),
                created_at=np.datetime64('now').astype(str),
                lighting_conditions=validation_result["lighting"]
            )
            
            return {
                "user_id": user_id,
                "quality_score": quality_score,
                "face_detected": True,
                "encoding_length": len(face_encodings[0]),
                "validation_result": validation_result,
                "lighting_condition": ImageUtils.classify_lighting_condition(validation_result["lighting"]),
                "lighting_metrics": validation_result["lighting"],
                "face_encoding": face_encoding_record.dict()
            }
            
        except Exception as e:
            raise Exception(f"Face registration failed: {str(e)}")

    async def _process_face_image(self, image: np.ndarray) -> Tuple[np.ndarray, dict]:
        """Process face image and return encoding with quality metrics"""
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return None, {"error": "No face detected"}
            
        if len(face_locations) > 1:
            return None, {"error": "Multiple faces detected"}
            
        top, right, bottom, left = face_locations[0]
        face_image = image[top:bottom, left:right]
        
        # Calculate quality metrics
        quality_metrics = {
            'brightness': np.mean(face_image) / 255.0,
            'contrast': np.std(face_image) / 255.0,
            'sharpness': cv2.Laplacian(cv2.cvtColor(face_image, cv2.COLOR_RGB2GRAY), cv2.CV_64F).var(),
            'face_size': (bottom - top) * (right - left) / (image.shape[0] * image.shape[1])
        }
        
        # Add overall quality score
        quality_metrics['overall_quality'] = (
            0.3 * quality_metrics['brightness'] +
            0.3 * quality_metrics['contrast'] +
            0.2 * quality_metrics['sharpness'] / 1000 +  # Normalize sharpness
            0.2 * quality_metrics['face_size']
        )
        
        # Validate using ImageUtils: only block if occluded/mask or very low light
        try:
            validation_result = ImageUtils.validate_face_image(image, face_locations[0])
        except Exception as e:
            return None, {**quality_metrics, "error": f"Validation failed: {str(e)}"}

        if not validation_result.get('valid', False):
            # Return helpful flags for the caller (occluded, low_light, reason)
            return None, {**quality_metrics, **validation_result, "error": "Validation failed"}
            
        # Get face encoding
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
        
    async def verify_face(self, image: np.ndarray, user_id: str) -> Dict:
        """Verify a face against registered template with quality checks"""
        try:
            if user_id not in self.known_face_encodings:
    
                return {
                    'success': False,
                    'error': 'User not registered',
                    'face_detected': False,
                    'match_score': 0.0
                }

            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Process face image
            face_encoding, quality_metrics = await self._process_face_image(rgb_image)
            
            if face_encoding is None:
                return {
                    'success': False,
                    'error': quality_metrics.get('error', 'Failed to process face'),
                    'face_detected': False,
                    'quality_metrics': quality_metrics,
                    'match_score': 0.0
                }
            
            # Calculate face distance
            face_distances = face_recognition.face_distance([self.known_face_encodings[user_id]], face_encoding)
            
            if len(face_distances) == 0:
                return {
                    'success': False,
                    'error': 'Failed to compare faces',
                    'face_detected': True,
                    'quality_metrics': quality_metrics,
                    'match_score': 0.0
                }
            
            # Convert distance to similarity score (1 - distance)
            match_score = float(1 - face_distances[0])
            
            # Update verification metadata
            metadata = self.known_face_metadata[user_id]
            metadata['last_verified'] = datetime.now().isoformat()
            metadata['verification_attempts'] += 1
            metadata['last_match_score'] = match_score
            
            # Determine if match is successful
            is_match = match_score >= self.quality_threshold
            
            return {
                'success': is_match,
                'user_id': user_id,
                'face_detected': True,
                'quality_metrics': quality_metrics,
                'match_score': match_score,
                'threshold': self.quality_threshold
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'face_detected': False,
                'match_score': 0.0
            }
        try:
            if user_id not in self.known_face_encodings:
                raise Exception("User face not registered")
            
            # Convert BGR to RGB for face_recognition library
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            face_locations = face_recognition.face_locations(rgb_image)
            if not face_locations:
                return {
                    'verified': False,
                    'confidence': 0.0,
                    'face_detected': False,
                    'message': 'No face detected in verification image'
                }
            
            # Get face encoding
            face_encoding = face_recognition.face_encodings(rgb_image, face_locations)[0]
            
            # Compare with stored encoding
            matches = face_recognition.compare_faces([self.known_face_encodings[user_id]], face_encoding, tolerance=0.6)
            face_distances = face_recognition.face_distance([self.known_face_encodings[user_id]], face_encoding)
            
            # Calculate confidence (inverse of face distance)
            confidence = float(1 - face_distances[0])
            verified = matches[0] and confidence >= 0.5
            
            # Get quality metrics
            quality_metrics = await self.get_face_quality_metrics(image)
            
            return {
                'verified': verified,
                'confidence': confidence,
                'face_detected': True,
                'quality_score': quality_metrics['overall_quality'],
                'lighting_conditions': quality_metrics['lighting'],
                'message': 'Face verification successful' if verified else 'Face verification failed'
            }
            
        except Exception as e:
            raise Exception(f"Face verification failed: {str(e)}")
        try:
            if user_id not in face_model.known_face_encodings:
                raise Exception("User face not registered")
            
            # Preprocess image
            processed_image = ImageUtils.preprocess_face_image(image)
            
            # Detect and encode face
            face_encoding = face_model.encode_face(processed_image)
            if face_encoding is None:
                verification_result = VerificationResult(
                    verified=False,
                    confidence=0.0,
                    threshold=0.6,
                    message="No face detected in verification image",
                    face_detected=False
                )
                return verification_result.dict()
            
            # Verify face
            verified, confidence = face_model.verify_face(face_encoding, user_id)
            
            # Analyze lighting conditions
            lighting_metrics = ImageUtils.analyze_lighting_conditions(processed_image)
            lighting_condition = ImageUtils.classify_lighting_condition(lighting_metrics)
            
            # Adaptive threshold based on lighting
            verification_threshold = self._calculate_adaptive_threshold(lighting_metrics)
            
            # Determine final verification result
            final_verified = verified and (confidence > verification_threshold)
            
            verification_result = VerificationResult(
                verified=final_verified,
                confidence=float(confidence),
                threshold=float(verification_threshold),
                message="Face verification successful" if final_verified else "Face verification failed",
                face_detected=True,
                lighting_condition=lighting_condition,
                lighting_metrics=lighting_metrics
            )
            
            return verification_result.dict()
            
        except Exception as e:
            raise Exception(f"Face verification failed: {str(e)}")

    def _calculate_adaptive_threshold(self, lighting: Dict[str, float]) -> float:
        """Calculate adaptive threshold based on lighting conditions"""
        base_threshold = 0.6
        
        # Adjust threshold based on lighting quality
        brightness_score = 1 - abs(lighting["brightness"] - 127) / 127
        sharpness_score = min(lighting["sharpness"] / 1000.0, 1.0)
        
        lighting_quality = (brightness_score + sharpness_score) / 2
        
        # Lower threshold for good lighting, higher for poor lighting
        adaptive_threshold = base_threshold + (0.2 * (1 - lighting_quality))
        
        return min(adaptive_threshold, 0.8)  # Cap at 0.8

    def get_face_encoding(self, user_id: str):
        """Get face encoding for storage in database"""
        if user_id in self.known_face_encodings:
            return self.known_face_encodings[user_id].tolist()
        return None

    async def get_face_quality_metrics(self, image: np.ndarray) -> Dict[str, Any]:
        """Get comprehensive face quality metrics"""
        # Convert to grayscale for some calculations
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Calculate brightness
        brightness = np.mean(gray)
        
        # Calculate contrast
        contrast = np.std(gray)
        
        # Calculate sharpness using Laplacian
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness = np.var(laplacian)
        
        # Normalize metrics to 0-1 range
        norm_brightness = min(max(brightness / 255, 0), 1)
        norm_contrast = min(max(contrast / 128, 0), 1)
        norm_sharpness = min(max(sharpness / 1000, 0), 1)
        
        # Lighting conditions
        lighting = {
            'brightness': float(norm_brightness),
            'contrast': float(norm_contrast),
            'uniformity': float(np.std(gray) / np.mean(gray))
        }
        
        # Overall quality score (weighted average)
        overall_quality = float(
            0.4 * norm_brightness +
            0.3 * norm_contrast +
            0.3 * norm_sharpness
        )
        
        return {
            'overall_quality': overall_quality,
            'lighting': lighting,
            'sharpness': float(norm_sharpness),
            'face_size': None  # Will be updated when face is detected
        }
        try:
            processed_image = ImageUtils.preprocess_face_image(image)
            face_locations = face_recognition.face_locations(processed_image)
            
            if len(face_locations) == 0:
                return {"face_detected": False}
            
            validation_result = ImageUtils.validate_face_image(processed_image, face_locations[0])
            quality_score = ImageUtils.calculate_face_quality_score(validation_result)
            lighting_condition = ImageUtils.classify_lighting_condition(validation_result["lighting"])
            
            return {
                "face_detected": True,
                "quality_score": quality_score,
                "lighting_condition": lighting_condition,
                "validation_result": validation_result,
                "meets_quality_threshold": quality_score >= self.quality_threshold
            }
            
        except Exception as e:
            return {
                "face_detected": False,
                "error": str(e)
            }

    async def debug_face_image(self, image: np.ndarray) -> Dict[str, Any]:
        """Debug endpoint to analyze face image without registration"""
        try:
            processed_image = ImageUtils.preprocess_face_image(image)
            face_locations = face_recognition.face_locations(processed_image)
            face_encodings = face_recognition.face_encodings(processed_image, face_locations)
            
            debug_info = {
                "faces_detected": len(face_locations),
                "face_locations": face_locations,
                "encodings_generated": len(face_encodings)
            }
            
            if len(face_locations) > 0:
                validation_result = ImageUtils.validate_face_image(processed_image, face_locations[0])
                quality_score = ImageUtils.calculate_face_quality_score(validation_result)
                lighting_condition = ImageUtils.classify_lighting_condition(validation_result["lighting"])
                
                debug_info.update({
                    "quality_metrics": {
                        "quality_score": quality_score,
                        "lighting_condition": lighting_condition,
                        "validation_result": validation_result,
                        "meets_threshold": quality_score >= self.quality_threshold
                    },
                    "face_encoding_sample": face_encodings[0].tolist()[:5] if face_encodings else None  # First 5 values
                })
                
                # Create debug image with landmarks
                debug_image = ImageUtils.draw_face_landmarks(processed_image, face_locations[0])
                debug_info["debug_image"] = ImageUtils.image_to_base64(debug_image)
            
            return debug_info
            
        except Exception as e:
            return {
                "error": str(e),
                "faces_detected": 0
            }