import numpy as np
import cv2
import face_recognition
from .image_utils import ImageUtils


def strict_quality_check(image: np.ndarray) -> dict:
    """Permissive quality check used for live captures.
    Returns approved=True when any single face is detected. This avoids blocking
    users for minor issues like blur, framing, or lighting.
    """
    try:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) if image.ndim == 3 else image
        face_locations = face_recognition.face_locations(rgb_image)
        if not face_locations:
            return { 'approved': False, 'details': { 'face_detected': False }, 'message': 'No face detected' }

        top, right, bottom, left = face_locations[0]
        face_image = rgb_image[top:bottom, left:right]
        lighting = ImageUtils.analyze_lighting_conditions(face_image)

        return {
            'approved': True,
            'details': {
                'face_detected': True,
                'face_location': [int(top), int(right), int(bottom), int(left)],
                'lighting': lighting
            },
            'message': 'Face detected — accepted (permissive mode)'
        }
    except Exception as e:
        return {'approved': False, 'details': {}, 'message': f'Error during permissive check: {str(e)}'}
