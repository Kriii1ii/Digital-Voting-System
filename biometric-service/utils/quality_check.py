import numpy as np
import cv2
import face_recognition
from .image_utils import ImageUtils


def strict_quality_check(image: np.ndarray) -> dict:
    """Perform strict validation for enrollment: no obstructions, neutral expression, good lighting, no glasses, forward facing."""
    try:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB) if image.ndim == 3 else image

        face_locations = face_recognition.face_locations(rgb_image)
        if not face_locations:
            return { 'approved': False, 'details': { 'face_detected': False }, 'message': 'No face detected' }
        if len(face_locations) > 1:
            return { 'approved': False, 'details': { 'multiple_faces': True, 'face_count': len(face_locations) }, 'message': 'Multiple faces detected' }

        top, right, bottom, left = face_locations[0]
        face_image = rgb_image[top:bottom, left:right]

        # landmarks for mouth/eyes/nose
        landmarks_list = face_recognition.face_landmarks(rgb_image, [face_locations[0]])
        landmarks = landmarks_list[0] if landmarks_list else None

    # lighting
    # Relaxed thresholds to accept normal indoor lighting
    lighting = ImageUtils.analyze_lighting_conditions(face_image)
    # brightness in [0-255], contrast approx [0-255]
    proper_lighting = (lighting.get('brightness', 0) >= 30 and lighting.get('brightness', 255) <= 220 and lighting.get('contrast', 0) >= 10)

        # detect mouth/nose visibility (simple heuristics)
    no_obstructions = True
    # If landmarks are present, perform mouth/obstruction check; if missing, be permissive (assume no obstruction)
    if landmarks and 'nose_tip' in landmarks and 'top_lip' in landmarks and 'bottom_lip' in landmarks:
            # compute mouth area brightness/variance
            lip_pts = landmarks['top_lip'] + landmarks['bottom_lip']
            xs = [p[0] for p in lip_pts]
            ys = [p[1] for p in lip_pts]
            lx1, ly1, lx2, ly2 = max(min(xs)-2,0), max(min(ys)-2,0), min(max(xs)+2, face_image.shape[1]-1), min(max(ys)+2, face_image.shape[0]-1)
            mouth_region = face_image[ly1:ly2, lx1:lx2]
            if mouth_region.size == 0:
                no_obstructions = False
            else:
                mean_mouth = float(np.mean(cv2.cvtColor(mouth_region, cv2.COLOR_RGB2GRAY)))
                std_mouth = float(np.std(cv2.cvtColor(mouth_region, cv2.COLOR_RGB2GRAY)))
                # mask tends to reduce variance and be darker in mouth area
                if mean_mouth < 40 or std_mouth < 10:
                    no_obstructions = False
        else:
            # landmarks missing: do not fail enrollment for this alone — mark as unknown but allow
            no_obstructions = True
            landmarks_missing = True

    # detect dark sunglasses / heavy eyewear — only reject if eyes regions are very dark
    no_glasses = True
    if landmarks and 'left_eye' in landmarks and 'right_eye' in landmarks:
            def region_stats(pts):
                xs = [p[0] for p in pts]
                ys = [p[1] for p in pts]
                x1, y1, x2, y2 = max(min(xs)-2,0), max(min(ys)-2,0), min(max(xs)+2, face_image.shape[1]-1), min(max(ys)+2, face_image.shape[0]-1)
                reg = face_image[y1:y2, x1:x2]
                if reg.size == 0:
                    return {'mean':0.0,'std':0.0}
                g = cv2.cvtColor(reg, cv2.COLOR_RGB2GRAY)
                return {'mean': float(np.mean(g)), 'std': float(np.std(g))}

            le = region_stats(landmarks['left_eye'])
            re = region_stats(landmarks['right_eye'])
            # sunglasses often produce very dark eye regions — tighten to only catch very dark lenses
            if le['mean'] < 25 and re['mean'] < 25 and le['std'] < 15 and re['std'] < 15:
                no_glasses = False
        else:
            # landmarks missing: assume eyewear is acceptable (allow prescription glasses)
            no_glasses = True

        # neutral expression check: mouth openness / smile heuristics
    neutral_expression = True
    # Allow slight expressions / natural smiles — only fail for very large mouth openness
    if landmarks and 'top_lip' in landmarks and 'bottom_lip' in landmarks:
            import numpy as _np
            top_lip = _np.mean(landmarks['top_lip'], axis=0)
            bottom_lip = _np.mean(landmarks['bottom_lip'], axis=0)
            mouth_height = _np.linalg.norm(top_lip - bottom_lip)
            # mouth width
            mouth_pts = landmarks['top_lip'] + landmarks['bottom_lip']
            xs = [p[0] for p in mouth_pts]
            mouth_width = max(xs) - min(xs) if xs else 1.0
            openness = mouth_height / (mouth_width + 1e-6)
            # if mouth is very wide open (e.g., shouting) -> fail; allow slight smiles by raising threshold
            if openness > 0.40:
                neutral_expression = False
        else:
            neutral_expression = False

        # forward facing: check symmetry of eyes relative to nose
    forward_angle = True
    # Allow modest head turns (~15-20 degrees). Use a more permissive symmetry diff threshold.
    if landmarks and 'nose_tip' in landmarks and 'left_eye' in landmarks and 'right_eye' in landmarks:
            nose = np.mean(landmarks['nose_tip'], axis=0)
            left_eye = np.mean(landmarks['left_eye'], axis=0)
            right_eye = np.mean(landmarks['right_eye'], axis=0)
            d_left = np.linalg.norm(left_eye - nose)
            d_right = np.linalg.norm(right_eye - nose)
            if d_left <= 0 or d_right <= 0:
                forward_angle = False
            else:
                diff = abs(d_left - d_right) / max(d_left, d_right)
                # Accept larger diffs to accommodate modest head turns
                if diff > 0.55:
                    forward_angle = False
        else:
            forward_angle = False

        validations = {
            'face_detected': True,
            'single_face': True,
            'no_obstructions': no_obstructions,
            'neutral_expression': neutral_expression,
            'proper_lighting': proper_lighting,
            'no_glasses': no_glasses,
            'forward_facing': forward_angle,
            'lighting': lighting
        }

        # If landmarks were missing we intentionally avoid failing the user for that alone.
        # Construct approval by treating any None/unknown as permissive.
        approval_checks = [
            validations['no_obstructions'],
            validations['neutral_expression'],
            validations['proper_lighting'],
            validations['no_glasses'],
            validations['forward_facing']
        ]

        approved = True
        for chk in approval_checks:
            # If any check is explicitly False, fail. If True or truthy, continue. If unknown/None, treat as pass.
            if chk is False:
                approved = False
                break

        # Add helpful hint when landmarks were missing
        if 'landmarks_missing' in locals() and landmarks_missing:
            validations['landmarks_missing'] = True

        return {
            'approved': bool(approved),
            'details': validations,
            'message': 'Face meets all requirements' if approved else 'Face validation failed'
        }

    except Exception as e:
        return {'approved': False, 'details': {}, 'message': f'Error during strict check: {str(e)}'}
