"""
Quality checking utilities for face images.
Checks blur, brightness, face count, and optionally head pose.
"""
import cv2
import numpy as np
import face_recognition


def check_quality(img, min_blur=100, min_brightness=50, max_brightness=200):
    """
    Check the quality of a face image.
    
    Args:
        img: OpenCV image in BGR format
        min_blur: Minimum Laplacian variance threshold (default: 100)
        min_brightness: Minimum average brightness (default: 50)
        max_brightness: Maximum average brightness (default: 200)
    
    Returns:
        tuple: (passed: bool, reasons: list, metrics: dict)
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Calculate blur using Laplacian variance
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    # Calculate brightness
    brightness = np.mean(gray)
    
    # Detect faces
    faces = face_recognition.face_locations(img)
    face_count = len(faces)
    
    # Check for face landmarks (for head pose estimation)
    landmarks = face_recognition.face_landmarks(img)
    
    reasons = []
    passed = True
    
    # Face count check
    if face_count == 0:
        passed = False
        reasons.append("No face detected in image")
    elif face_count > 1:
        passed = False
        reasons.append(f"Multiple faces detected ({face_count}). Please ensure only one person is in frame")
    
    # Blur check
    if blur_score < min_blur:
        passed = False
        reasons.append(f"Image too blurry (score: {blur_score:.1f}, minimum: {min_blur})")
    
    # Brightness check
    if brightness < min_brightness:
        passed = False
        reasons.append(f"Image too dark (brightness: {brightness:.1f}, minimum: {min_brightness})")
    elif brightness > max_brightness:
        passed = False
        reasons.append(f"Image too bright (brightness: {brightness:.1f}, maximum: {max_brightness})")
    
    # Head pose check (optional - checks if face is roughly frontal)
    if landmarks and face_count == 1:
        head_pose_ok, head_pose_reason = check_head_pose(landmarks[0])
        if not head_pose_ok:
            passed = False
            reasons.append(head_pose_reason)
    
    metrics = {
        "blur_score": float(blur_score),
        "brightness": float(brightness),
        "face_count": face_count,
        "image_size": f"{img.shape[1]}x{img.shape[0]}"
    }
    
    return passed, reasons, metrics


def check_head_pose(landmarks):
    """
    Check if the head is roughly frontal by comparing eye positions.
    
    Args:
        landmarks: Dictionary of facial landmarks from face_recognition
    
    Returns:
        tuple: (is_frontal: bool, reason: str or None)
    """
    if 'left_eye' not in landmarks or 'right_eye' not in landmarks:
        return True, None  # Can't determine, so pass
    
    # Calculate center of each eye
    left_eye_center = np.mean(landmarks['left_eye'], axis=0)
    right_eye_center = np.mean(landmarks['right_eye'], axis=0)
    
    # Calculate horizontal distance and vertical difference
    eye_distance = np.linalg.norm(left_eye_center - right_eye_center)
    vertical_diff = abs(left_eye_center[1] - right_eye_center[1])
    
    # Check if eyes are roughly horizontal (face not too tilted)
    tilt_ratio = vertical_diff / eye_distance if eye_distance > 0 else 0
    
    if tilt_ratio > 0.15:  # More than 15% tilt
        return False, f"Head appears tilted. Please face the camera directly"
    
    # Check face width (nose to eyes ratio) for frontal check
    if 'nose_tip' in landmarks:
        nose_tip = np.array(landmarks['nose_tip'][2])  # Middle of nose tip
        eye_midpoint = (left_eye_center + right_eye_center) / 2
        
        # Check if nose is roughly centered between eyes
        horizontal_offset = abs(nose_tip[0] - eye_midpoint[0])
        offset_ratio = horizontal_offset / eye_distance if eye_distance > 0 else 0
        
        if offset_ratio > 0.25:  # Nose is too far from center
            return False, "Please face the camera directly (head turned too much)"
    
    return True, None


def get_quality_feedback(metrics):
    """
    Generate user-friendly feedback based on quality metrics.
    
    Args:
        metrics: Dictionary of quality metrics
    
    Returns:
        list: List of feedback messages
    """
    feedback = []
    
    blur_score = metrics.get('blur_score', 0)
    brightness = metrics.get('brightness', 0)
    
    if blur_score < 150:
        feedback.append("💡 Tip: Hold your device steady for a clearer image")
    
    if brightness < 80:
        feedback.append("💡 Tip: Try moving to a brighter location")
    elif brightness > 180:
        feedback.append("💡 Tip: Reduce direct lighting or move to avoid glare")
    
    if metrics.get('face_count', 0) > 1:
        feedback.append("💡 Tip: Ensure you're alone in the frame")
    
    return feedback
