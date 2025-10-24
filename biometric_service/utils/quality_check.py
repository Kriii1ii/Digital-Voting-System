"""
Image quality checking utilities for face recognition.
Checks for blur, brightness, face count, and head pose.
"""
import cv2
import numpy as np
import face_recognition


def check_quality(img):
    """
    Check if the face image meets quality requirements.
    
    Args:
        img: OpenCV image (BGR format)
    
    Returns:
        tuple: (passed: bool, reasons: list[str])
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = np.mean(gray)
    faces = face_recognition.face_locations(img)

    reasons = []
    passed = True
    
    # Check face count
    if len(faces) == 0:
        passed = False
        reasons.append("No face detected")
    elif len(faces) > 1:
        passed = False
        reasons.append("Multiple faces detected - only one face required")
    
    # Check blur
    if blur < 100:
        passed = False
        reasons.append(f"Image too blurry (blur score: {blur:.1f}, minimum: 100)")
    
    # Check brightness
    if brightness < 50:
        passed = False
        reasons.append(f"Image too dark (brightness: {brightness:.1f}, minimum: 50)")
    elif brightness > 200:
        passed = False
        reasons.append(f"Image too bright (brightness: {brightness:.1f}, maximum: 200)")
    
    # Optional: Check head pose using landmarks
    if len(faces) == 1:
        landmarks = face_recognition.face_landmarks(img)
        if landmarks:
            pose_issues = check_head_pose(landmarks[0])
            if pose_issues:
                passed = False
                reasons.extend(pose_issues)
    
    return passed, reasons


def check_head_pose(landmarks):
    """
    Check if head pose is roughly frontal using facial landmarks.
    
    Args:
        landmarks: Dictionary of facial landmarks from face_recognition
    
    Returns:
        list: Issues found with head pose, empty if acceptable
    """
    issues = []
    
    # Get eye positions
    left_eye = np.array(landmarks['left_eye'])
    right_eye = np.array(landmarks['right_eye'])
    
    # Calculate eye centers
    left_eye_center = left_eye.mean(axis=0)
    right_eye_center = right_eye.mean(axis=0)
    
    # Check eye level (should be roughly horizontal)
    eye_slope = abs(left_eye_center[1] - right_eye_center[1])
    if eye_slope > 15:
        issues.append(f"Head appears tilted (eye slope: {eye_slope:.1f})")
    
    # Check eye distance ratio (perspective check)
    nose_bridge = np.array(landmarks['nose_bridge'])
    nose_tip = np.array(landmarks['nose_tip'])
    
    if len(nose_bridge) > 0 and len(nose_tip) > 0:
        nose_center = np.mean(nose_bridge + nose_tip, axis=0)
        
        # Distance from nose to each eye
        left_dist = np.linalg.norm(left_eye_center - nose_center)
        right_dist = np.linalg.norm(right_eye_center - nose_center)
        
        # Ratio should be close to 1.0 for frontal face
        if left_dist > 0 and right_dist > 0:
            ratio = max(left_dist, right_dist) / min(left_dist, right_dist)
            if ratio > 1.3:
                issues.append(f"Face not frontal - please look directly at camera")
    
    return issues


def get_quality_metrics(img):
    """
    Get detailed quality metrics for an image.
    
    Args:
        img: OpenCV image (BGR format)
    
    Returns:
        dict: Quality metrics including blur, brightness, face count
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = np.mean(gray)
    faces = face_recognition.face_locations(img)
    
    return {
        "blur_score": float(blur),
        "blur_pass": blur >= 100,
        "brightness": float(brightness),
        "brightness_pass": 50 <= brightness <= 200,
        "face_count": len(faces),
        "face_count_pass": len(faces) == 1
    }
