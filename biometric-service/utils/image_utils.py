import cv2
import numpy as np
import base64
import face_recognition
from typing import Tuple, Dict, Any, Optional
import io
from PIL import Image, ImageEnhance

class ImageUtils:
    @staticmethod
    def base64_to_image(base64_string: str) -> np.ndarray:
        """
        Convert base64 string to OpenCV image
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            image_array = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Failed to decode base64 image")
                
            # Convert BGR to RGB
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            return image
            
        except Exception as e:
            raise ValueError(f"Failed to convert base64 to image: {str(e)}")

    @staticmethod
    def image_to_base64(image: np.ndarray) -> str:
        """
        Convert OpenCV image to base64 string
        """
        try:
            # Convert RGB to BGR for OpenCV
            if len(image.shape) == 3 and image.shape[2] == 3:
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            _, buffer = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 90])
            image_base64 = base64.b64encode(buffer).decode('utf-8')
            return f"data:image/jpeg;base64,{image_base64}"
            
        except Exception as e:
            raise ValueError(f"Failed to convert image to base64: {str(e)}")

    @staticmethod
    def preprocess_face_image(image: np.ndarray, target_size: Tuple[int, int] = (800, 600)) -> np.ndarray:
        """
        Preprocess face image for better recognition
        """
        try:
            # Resize image maintaining aspect ratio
            height, width = image.shape[:2]
            scale = min(target_size[0] / width, target_size[1] / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            
            if new_width != width or new_height != height:
                image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
            
            # Enhance image quality
            image = ImageUtils.enhance_contrast(image)
            image = ImageUtils.denoise_image(image)
            image = ImageUtils.normalize_lighting(image)
            
            return image
            
        except Exception as e:
            print(f"Image preprocessing error: {e}")
            return image

    @staticmethod
    def enhance_contrast(image: np.ndarray) -> np.ndarray:
        """Enhance image contrast using CLAHE"""
        try:
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            lab_planes = list(cv2.split(lab))
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            lab_planes[0] = clahe.apply(lab_planes[0])
            lab = cv2.merge(lab_planes)
            return cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        except Exception:
            return image

    @staticmethod
    def denoise_image(image: np.ndarray) -> np.ndarray:
        """Remove noise from image"""
        try:
            return cv2.medianBlur(image, 3)
        except Exception:
            return image

    @staticmethod
    def normalize_lighting(image: np.ndarray) -> np.ndarray:
        """Normalize lighting conditions"""
        try:
            # Convert to YUV color space
            yuv = cv2.cvtColor(image, cv2.COLOR_RGB2YUV)
            
            # Equalize the Y channel (luminance)
            yuv[:,:,0] = cv2.equalizeHist(yuv[:,:,0])
            
            # Convert back to RGB
            return cv2.cvtColor(yuv, cv2.COLOR_YUV2RGB)
        except Exception:
            return image

    @staticmethod
    def analyze_lighting_conditions(image: np.ndarray) -> Dict[str, float]:
        """Analyze lighting conditions in the image"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Calculate brightness (0-255)
            brightness = np.mean(gray)
            
            # Calculate contrast (standard deviation)
            contrast = np.std(gray)
            
            # Calculate sharpness (variance of Laplacian)
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            return {
                "brightness": float(brightness),
                "contrast": float(contrast),
                "sharpness": float(sharpness)
            }
        except Exception as e:
            print(f"Lighting analysis error: {e}")
            return {"brightness": 0.0, "contrast": 0.0, "sharpness": 0.0}

    @staticmethod
    def validate_face_image(image: np.ndarray, face_location: Tuple) -> Dict[str, Any]:
        """Validate face image quality"""
        try:
            top, right, bottom, left = face_location
            
            # Extract face region
            face_image = image[top:bottom, left:right]
            
            if face_image.size == 0:
                return {"valid": False, "reason": "Empty face region"}
            
            # Calculate face size ratio
            image_area = image.shape[0] * image.shape[1]
            face_area = (right - left) * (bottom - top)
            size_ratio = face_area / image_area

            # Basic size check: ensure face isn't tiny
            if size_ratio < 0.03:  # Face should be at least ~3% of image
                return {"valid": False, "reason": "Face too small", "face_area": face_area, "size_ratio": float(size_ratio)}

            # Check lighting conditions (brightness in 0-255)
            lighting = ImageUtils.analyze_lighting_conditions(face_image)
            brightness = lighting.get("brightness", 0.0)
            low_light = brightness < 40  # very dim room

            # Detect basic occlusion/mask via landmarks: if essential landmarks (nose, eyes, lips) are missing,
            # assume occlusion (hand/mask covering important facial features).
            try:
                landmarks = face_recognition.face_landmarks(face_image)
                occluded = False
                if not landmarks or len(landmarks) == 0:
                    occluded = True
                else:
                    lm = landmarks[0]
                    # Require eyes and nose as minimal evidence of an uncovered face
                    required = ['left_eye', 'right_eye', 'nose_tip']
                    for r in required:
                        if r not in lm or not lm[r]:
                            occluded = True
                            break
                    # If lips are missing or very small, it may be a mask
                    if not occluded:
                        mouth_pts = lm.get('top_lip', []) + lm.get('bottom_lip', [])
                        if len(mouth_pts) < 6:
                            occluded = True
            except Exception:
                # If landmark detection fails, be conservative and assume occlusion if brightness is low
                occluded = False

            valid = (not occluded) and (not low_light)

            return {
                "valid": bool(valid),
                "lighting": lighting,
                "low_light": bool(low_light),
                "occluded": bool(occluded),
                "size_ratio": float(size_ratio),
                "face_area": int(face_area),
                "reason": "Good quality" if valid else ("occluded" if occluded else "low_light" if low_light else "poor_quality")
            }
            
        except Exception as e:
            return {"valid": False, "reason": f"Validation error: {str(e)}"}

    @staticmethod
    def classify_lighting_condition(lighting_metrics: Dict[str, float]) -> str:
        """Classify lighting conditions based on metrics"""
        brightness = lighting_metrics["brightness"]
        sharpness = lighting_metrics["sharpness"]
        
        if brightness < 50:
            return "low_light"
        elif brightness > 200:
            return "overexposed"
        elif sharpness < 50:
            return "blurry"
        else:
            return "good"

    @staticmethod
    def calculate_face_quality_score(validation_result: Dict[str, Any]) -> float:
        """Calculate overall face quality score (0-1)"""
        try:
            if not validation_result["valid"]:
                return 0.0
            
            lighting = validation_result["lighting"]
            size_ratio = validation_result["size_ratio"]
            
            # Brightness score (ideal around 127)
            brightness_score = 1 - abs(lighting["brightness"] - 127) / 127
            
            # Sharpness score
            sharpness_score = min(lighting["sharpness"] / 1000.0, 1.0)
            
            # Size ratio score (ideal around 0.2-0.4)
            if size_ratio < 0.2:
                size_score = size_ratio / 0.2
            elif size_ratio > 0.4:
                size_score = 0.4 / size_ratio
            else:
                size_score = 1.0
            
            # Contrast score
            contrast_score = min(lighting["contrast"] / 100.0, 1.0)
            
            # Weighted quality score
            quality = (
                brightness_score * 0.25 +
                sharpness_score * 0.35 +
                size_score * 0.25 +
                contrast_score * 0.15
            )
            
            return max(0.0, min(1.0, quality))
            
        except Exception:
            return 0.0

    @staticmethod
    def draw_face_landmarks(image: np.ndarray, face_location: Tuple, landmarks: Any = None) -> np.ndarray:
        """Draw face landmarks and bounding box for visualization"""
        try:
            # Create a copy of the image
            debug_image = image.copy()
            top, right, bottom, left = face_location
            
            # Draw bounding box
            cv2.rectangle(debug_image, (left, top), (right, bottom), (0, 255, 0), 2)
            
            # Draw face area text
            face_area = (right - left) * (bottom - top)
            cv2.putText(debug_image, f"Area: {face_area}", (left, top - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
            return debug_image
            
        except Exception as e:
            print(f"Error drawing landmarks: {e}")
            return image
