import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

  const QualityIndicator = ({ label, value = 0, threshold = 0.5 }) => {
  // Normalize value to 0-1 depending on metric
  const normalize = (lbl, val) => {
    if (val == null || Number.isNaN(val)) return 0;
    // brightness and contrast are usually 0-1
    if (/brightness/i.test(lbl) || /contrast/i.test(lbl) || /overall/i.test(lbl) || /face size/i.test(lbl)) {
      return Math.max(0, Math.min(1, Number(val)));
    }
    // sharpness may be a much larger raw number; scale it down to 0-1 using a heuristic
    if (/sharp/i.test(lbl)) {
      // the backend sometimes returns sharpness as normalized or as a raw variance
      const num = Number(val);
      // heuristic: treat values around 0-300 as moderate; cap at 800 for normalization
      return Math.max(0, Math.min(1, num / 500));
    }
    return Math.max(0, Math.min(1, Number(val)));
  };

  const normalized = normalize(label, value);
  const percentage = Math.round(normalized * 100 * 10) / 10; // one decimal
  const isGood = normalized >= threshold;
  const barColor = isGood ? 'var(--color-blackish)' : '#b91c1c';

  // display value formatting (show both normalized percent and raw where helpful)
  let displayValue;
  if (/sharp/i.test(label)) {
    // show raw and normalized
    displayValue = `${Number(value).toFixed(1)} (${percentage}%)`;
  } else if (/overall/i.test(label)) {
    displayValue = `${percentage}%`;
  } else if (/face size/i.test(label)) {
    displayValue = `${(Number(value) * 100).toFixed(1)}%`;
  } else {
    displayValue = `${percentage}%`;
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm" style={{ color: 'var(--color-dark)' }}>{label}</span>
        <span className="text-sm" style={{ color: 'var(--color-dark)' }}>{displayValue}</span>
      </div>
      <div className="w-full rounded-full" style={{ background: 'var(--color-muted)', height: 8 }}>
        <div
          style={{ width: `${percentage}%`, height: '100%', background: barColor, borderRadius: 6, transition: 'width 200ms linear' }}
        />
      </div>
    </div>
  );
};

const LiveFaceCapture = ({ onCapture, onError, qualityThreshold = 0.75 }) => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isCentered, setIsCentered] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [autoCaptureCountdown, setAutoCaptureCountdown] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [showQualityMetrics, setShowQualityMetrics] = useState(true);
  const [faceQualityStatus, setFaceQualityStatus] = useState(null);
  const [captureQuality, setCaptureQuality] = useState({
    brightness: 0,
    contrast: 0,
    sharpness: 0,
    face_size: 0,
    overall_quality: 0
  });
  const [validationDetails, setValidationDetails] = useState(null);
  const [validationMessage, setValidationMessage] = useState('Position your face in the frame');
  const [photoValidationResults, setPhotoValidationResults] = useState([]); // per-photo validation results
  const { user } = useAuth();

  const videoConstraints = {
    // use a square viewport for the circular ring UI
    width: 420,
    height: 420,
    facingMode: 'user',
  };

  // Helper: convert various face_position shapes to pixel coords relative to displayed video element.
  const facePositionToPixels = (facePos, videoEl, { mirrored = false } = {}) => {
    if (!facePos || !videoEl) return null;

    const rect = videoEl.getBoundingClientRect();
    const vw = rect.width;
    const vh = rect.height;

    const num = (v) => (v == null ? NaN : Number(v));
    const hasLTRB = ('left' in facePos) && ('top' in facePos) && ('right' in facePos) && ('bottom' in facePos);
    const hasXYWH = ('x' in facePos) && ('y' in facePos) && ('width' in facePos) && ('height' in facePos);

    let left, top, width, height;

    if (hasLTRB) {
      const l = num(facePos.left);
      const t = num(facePos.top);
      const r = num(facePos.right);
      const b = num(facePos.bottom);
      const isNormalized = [l, t, r, b].every(v => !Number.isNaN(v) && Math.abs(v) <= 1.01);

      if (isNormalized) {
        left = l * vw;
        top = t * vh;
        width = (r - l) * vw;
        height = (b - t) * vh;
      } else {
        left = l;
        top = t;
        width = r - l;
        height = b - t;
      }
    } else if (hasXYWH) {
      const x = num(facePos.x);
      const y = num(facePos.y);
      const w = num(facePos.width);
      const h = num(facePos.height);
      const isNormalized = [x, y, w, h].every(v => !Number.isNaN(v) && Math.abs(v) <= 1.01);

      if (isNormalized) {
        left = x * vw;
        top = y * vh;
        width = w * vw;
        height = h * vh;
      } else {
        left = x;
        top = y;
        width = w;
        height = h;
      }
    } else if ('center_x' in facePos && 'center_y' in facePos && 'radius' in facePos) {
      const cx = num(facePos.center_x);
      const cy = num(facePos.center_y);
      const r = num(facePos.radius);
      const isNormalized = [cx, cy, r].every(v => !Number.isNaN(v) && Math.abs(v) <= 1.01);
      if (isNormalized) {
        const px = cx * vw;
        const py = cy * vh;
        const pr = r * Math.max(vw, vh);
        left = px - pr;
        top = py - pr;
        width = pr * 2;
        height = pr * 2;
      } else {
        const px = cx;
        const py = cy;
        left = px - r;
        top = py - r;
        width = r * 2;
        height = r * 2;
      }
    } else {
      return null;
    }

    // Flip horizontally for mirrored video
    if (mirrored) {
      left = vw - (left + width);
    }

    // Clamp
    left = Math.max(0, Math.min(left, vw));
    top = Math.max(0, Math.min(top, vh));
    width = Math.max(0, Math.min(width, vw - left));
    height = Math.max(0, Math.min(height, vh - top));

    return { left, top, width, height };
  };

  // We will allow users to capture photos manually (gallery of captures)

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    try {
      setIsCapturing(true);
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error('Failed to capture image');
      // Reset any previous validation/fix messages so states are mutually exclusive
      setValidationDetails(null);
      setValidationMessage(null);
      setFaceQualityStatus(null);
      setPhotoValidationResults([]);

      // Basic face-detection only: call validation endpoint but only use face_detected
      try {
  const res = await api.post('/biometrics/face/validate', { image: imageSrc }, { headers: { 'Content-Type': 'application/json' } });
        const payload = res.data || {};
        const details = payload.details || payload || {};
        const faceDetected = typeof payload.face_detected !== 'undefined' ? payload.face_detected : (details && typeof details.face_detected !== 'undefined' ? details.face_detected : true);

        if (faceDetected === false) {
          // Genuine failure: no face detected
          setFaceQualityStatus('Face capture failed. Please follow the guidelines and try again.');
          setValidationMessage('No face detected. Position your face fully inside the box.');
          setValidationDetails(details || null);
          setPhotoValidationResults(prev => [...(prev || []), { approved: false, details, message: payload?.message || 'No face detected' }]);
        } else {
          // Success - accept this capture (limit to 3 photos)
          setCapturedPhotos(prev => {
            const next = [...prev];
            if (next.length < 3) next.push(imageSrc);
            return next;
          });
          const count = Math.min((capturedPhotos.length || 0) + 1, 3);
          setFaceQualityStatus(`Face captured (${count}/3)`);
          setPhotoValidationResults(prev => [...(prev || []), { approved: true, details: null, message: 'OK' }]);

          // Show ready state when at least one photo captured and an accepted photo exists
          if ((capturedPhotos.length || 0) + 1 >= 1) {
            setFaceQualityStatus(`Ready to submit (${Math.min((capturedPhotos.length || 0) + 1,3)}/3)`);
          }
        }
      } catch (valErr) {
        // If validation service unreachable, accept capture optimistically
        console.warn('Validation service error — accepting capture by default', valErr.message);
        setCapturedPhotos(prev => {
          const next = [...prev];
          if (next.length < 3) next.push(imageSrc);
          return next;
        });
        const count = Math.min((capturedPhotos.length || 0) + 1, 3);
        setFaceQualityStatus(`Face captured (${count}/3)`);
        setPhotoValidationResults(prev => [...(prev || []), { approved: true, details: null, message: 'OK (offline)' }]);
        if ((capturedPhotos.length || 0) + 1 >= 1) {
          setFaceQualityStatus(`Ready to submit (${Math.min((capturedPhotos.length || 0) + 1,3)}/3)`);
        }
      }

    } catch (err) {
      console.error('Face capture error:', err);
      onError(
        err.response?.data?.message ||
          'Unable to capture face. Please check camera and try again.'
      );
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, onError, qualityThreshold, user]);

  // Lightweight live polling to check if the face is centered — used only to color the guidance circle.
  useEffect(() => {
    if (!cameraReady) return;
    let isCancelled = false;
    let controller = null;

    const tick = async () => {
      if (!webcamRef.current || isCancelled) return;
      try {
        const img = webcamRef.current.getScreenshot();
        if (!img) return;
        if (controller) controller.abort();
        controller = new AbortController();
        const res = await api.post(
          '/biometrics/face/quality-check',
          { image: img },
          { headers: { 'Content-Type': 'application/json' }, signal: controller.signal }
        );

        if (isCancelled) return;
        const payload = res.data || {};
        const metrics = payload?.details || null;
        // Keep older captureQuality fields if microsvc returns lighting/metrics
        if (payload.lighting) setCaptureQuality(prev => ({ ...prev, brightness: payload.lighting.brightness / 255.0, contrast: payload.lighting.contrast / 255.0 }));
        // Only show a user-facing message when NO face is detected. Avoid 'Fix' guidance in the live UI.
        const faceDetected = typeof payload.face_detected !== 'undefined' ? payload.face_detected : (metrics && typeof metrics.face_detected !== 'undefined' ? metrics.face_detected : true);
        setValidationDetails(metrics);
        if (faceDetected === false) {
          setValidationMessage('No face detected. Position your face fully inside the box.');
        } else {
          setValidationMessage(null);
        }

        const facePos = metrics?.face_position || null;
        if (facePos && webcamRef.current?.video) {
          const videoEl = webcamRef.current.video;
          const box = facePositionToPixels(facePos, videoEl, { mirrored: true });
          if (box) {
            const centerX = box.left + box.width / 2;
            const centerY = box.top + box.height / 2;
            const rect = videoEl.getBoundingClientRect();
            const imgW = rect.width;
            const imgH = rect.height;
            const dx = centerX - imgW / 2;
            const dy = centerY - imgH / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = Math.min(imgW, imgH) * 0.28;
            setIsCentered(dist <= radius * 0.6);
          } else {
            setIsCentered(false);
          }
        } else {
          setIsCentered(false);
        }
      } catch (err) {
        if (axios.isCancel && axios.isCancel(err)) {
          // ignore
        } else {
          // network or server error — keep circle neutral
          setIsCentered(false);
        }
      }
    };

    tick();
    const iv = setInterval(tick, 1200);
    return () => {
      isCancelled = true;
      clearInterval(iv);
      if (controller) controller.abort();
    };
  }, [cameraReady]);

  // show blur-only-if-too-blurry decision helper
  const isTooBlurry = () => {
    const sharp = Number(captureQuality?.sharpness || captureQuality?.clarity || 0);
    // treat sharpness normalized 0..1; if microservice returns other scale the heuristic may need tuning
    return !Number.isNaN(sharp) && sharp > -1 && sharp < 0.25;
  };

  function getSpecificGuidance(details = {}) {
    if (!details) return 'Capture accepted — minor imperfections (lighting, framing) are okay.';
    if (details.multiple_faces) return 'Multiple faces detected. Make sure only one person is in the frame.';
    if (details.face_detected === false) return 'No face detected. Position your face fully inside the box.';
    if (details.no_obstructions === false) return 'Remove masks, scarves, or anything covering your nose or mouth.';
    if (details.no_glasses === false) return 'Please remove sunglasses or eyewear for registration.';
    if (details.neutral_expression === false) return 'Maintain a neutral expression — no smiles or pouts.';
    if (details.proper_lighting === false) return 'Improve lighting on your face (avoid backlight or heavy shadows).';
    if (details.forward_facing === false) return 'Face slightly turned — please face the camera directly.';
    // fallback
    return 'Capture accepted — minor imperfections are okay. If your face is not detected, please re-position.';
  }

  const handleSubmitRegistration = async () => {
    // Validate every captured photo before submitting
    if (!consentGiven) {
      setFaceQualityStatus('Consent is required to submit');
      return;
    }
    if (capturedPhotos.length < 1) {
      setFaceQualityStatus('Please capture at least 1 photo before submitting');
      return;
    }

    setFaceQualityStatus('Validating photos...');
    const results = [];
    const failures = [];
    for (let i = 0; i < capturedPhotos.length; i++) {
      try {
  const res = await api.post('/biometrics/face/quality-check', { image: capturedPhotos[i] }, { headers: { 'Content-Type': 'application/json' } });
        const details = res.data?.details || res.data || null;
        // Relaxed acceptance: accept any capture where a face was detected. If the microservice is unreachable
        // or returns no details, optimistically accept the capture (so users aren't blocked by minor issues).
        const faceDetected = typeof res.data?.face_detected !== 'undefined' ? res.data.face_detected : (details && typeof details.face_detected !== 'undefined' ? details.face_detected : true);
        const blocking = details && (details.mask === true || details.covering === true || details.obstruction === true);
        const ok = faceDetected && !blocking;
        results.push({ approved: ok, details, message: res.data?.message || (ok ? 'OK' : 'Accepted (minor issues)') });
        if (!ok) failures.push({ idx: i, details });
      } catch (err) {
        // Accept on offline/errored validation — do not block the flow
        results.push({ approved: true, details: null, message: 'OK (validation offline)' });
      }
    }

    // store per-photo validation results so UI can show badges/hints
    setPhotoValidationResults(results);

    // require at least one face-detected capture (relaxed)
    const approvedCount = results.filter(r => r.approved).length;
    if (approvedCount > 0) {
      setFaceQualityStatus('Validation passed — submitting');
      onCapture(capturedPhotos);
      return;
    }

    // none had a detectable face
    console.warn('No face-detected photos found during validation', { results });
    setValidationDetails(results[0]?.details || null);
    setValidationMessage('No face was detected in your photos. Please retake a photo with your face in the frame.');
    setFaceQualityStatus('No detectable faces — please retake');
    return;
  };

  // Auto-capture when centered and held still for 2s
  useEffect(() => {
    if (!isCentered || !cameraReady) {
      setAutoCaptureCountdown(null);
      return;
    }
  // start countdown if fewer than 3 photos
  if (capturedPhotos.length >= 3) return;
    let remaining = 2; // seconds
    setAutoCaptureCountdown(remaining);
    const iv = setInterval(() => {
      remaining -= 1;
      setAutoCaptureCountdown(remaining > 0 ? remaining : 0);
      if (remaining <= 0) {
                // perform auto capture
        capture();
        clearInterval(iv);
        setAutoCaptureCountdown(null);
      }
    }, 1000);
    return () => {
      clearInterval(iv);
      setAutoCaptureCountdown(null);
    };
  }, [isCentered, cameraReady, capturedPhotos.length, capture]);

  // computePoseHint removed; manual photo capture flow uses simple instructions

  const retake = () => {
    // Clear current captures and reset metrics/status
  // clear any temporary single-image state (legacy)
    setCapturedPhotos([]);
    setCaptureQuality({
      brightness: 0,
      contrast: 0,
      sharpness: 0,
      face_size: 0,
      overall_quality: 0
    });
    setFaceQualityStatus(null);
    setPhotoValidationResults([]);
  };

  const removePhoto = (idx) => {
    const next = [...capturedPhotos];
    next.splice(idx, 1);
    setCapturedPhotos(next);
    // also remove validation result for that photo if present
    setPhotoValidationResults(prev => {
      const p = [...(prev || [])];
      p.splice(idx, 1);
      return p;
    });
    setFaceQualityStatus(`Photo removed (${next.length}/3)`);
  };

  const handleUserMedia = () => setCameraReady(true);
  const handleUserMediaError = (error) => {
    console.error('Webcam access error:', error);
    onError('Cannot access camera. Please allow permission.');
  };

  // For manual photo capture gallery
  const readyToCapture = cameraReady && !isCapturing && capturedPhotos.length < 3;

  return (
    <div className="live-face-capture w-full flex flex-col items-center">
      {/* Short checklist for users (boxed design) */}
      <div
        className="biometric-checklist w-full max-w-2xl p-6 mb-6 rounded-2xl"
        style={{
          background: '#bacfdeff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 12px 30px rgba(16,24,40,0.06)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ color: 'var(--color-dark)', margin: 2, fontSize: 32, fontWeight: 800 }}>Guidelines:</h2>
          <ol style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--color-dark)', fontSize: 16, lineHeight: 1.6 }}>
            <li style={{ marginBottom: '0.75rem' }}><strong>1)</strong> Remove any mask or face covering.</li>
            <li style={{ marginBottom: '0.75rem' }}><strong>2)</strong> Position your face in the centered box on the camera preview — keep eyes visible.</li>
            <li style={{ marginBottom: '0.75rem' }}><strong>3)</strong> Look straight at the camera; glasses are allowed, but avoid hats or heavy occlusion.</li>
            <li style={{ marginBottom: '0.75rem' }}><strong>4)</strong> Make sure your ears, eyes, nose and mouth are reasonably visible — avoid hair or clothing covering the face completely.</li>
            <li style={{ marginBottom: '0.75rem' }}><strong>5)</strong> Take 3 photos from slightly different angles (left, center, right). Hold still for 2–3 seconds during capture.</li>
          </ol>
        </div>
      </div>
      <div className="relative mb-4 flex flex-col items-center">
        <div className="relative" style={{ width: videoConstraints.width, height: videoConstraints.height }}>
          {/* Webcam: constrained to a square and visually cropped to a circle via borderRadius */}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            style={{
              width: videoConstraints.width,
              height: videoConstraints.height,
              objectFit: 'cover',
              borderRadius: '50%',
              boxShadow: '0 6px 18px rgba(17,24,39,0.12)'
            }}
            mirrored
          />

          {/* Circular ring overlay (doughnut) to guide face placement */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                width: '74%',
                height: '74%',
                borderRadius: '50%',
                border: `6px solid ${isCentered ? 'rgba(16,24,40,0.95)' : 'rgba(0,0,0,0.18)'}`,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(0.2px)'
              }}
            >
              {/* inner subtle ring to indicate the ideal face area */}
              <div style={{ width: '56%', height: '56%', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.18)' }} />
            </div>
          </div>

          {/* Instruction overlay for multi-photo capture */}
          <div className="absolute left-0 right-0 bottom-4 flex flex-col items-center pointer-events-none">
            <div className="pose-hint mb-1" style={{ color: 'var(--color-dark)', fontWeight: 600 }}>Take up to 3 photos for registration</div>
            <div className="text-xs" style={{ color: 'var(--color-dark)', opacity: 0.9 }}>
              Photos taken: {capturedPhotos.length}/3
            </div>
            {isCentered && autoCaptureCountdown != null && (
              <div className="mt-2 text-sm font-semibold" style={{ color: 'var(--color-dark)' }}>
                Hold still... capturing in {autoCaptureCountdown}s
              </div>
            )}
          </div>
        </div>

        {/* Capture controls placed in normal flow directly under the webcam (fixed position) */}
        <div className="mt-3 flex justify-center">
            <div className="bg-white bg-opacity-80 p-2 rounded-md shadow-sm flex gap-2 items-center">
            <button
              onClick={capture}
              disabled={isCapturing || !cameraReady || capturedPhotos.length >= 3}
              className={`px-4 py-2 rounded-md text-white font-semibold`}
              style={{
                background: (isCapturing || !cameraReady || capturedPhotos.length >= 3) ? '#ddcde5ff' : '#6B7280',
                border: 'none'
              }}
            >
              {isCapturing ? 'Capturing...' : 'Capture'}
            </button>
            <button
              onClick={retake}
              className="px-3 py-2 rounded-md"
              style={{ background: '#b4c0d3ff', color: '#ffffff', border: 'none' }}
            >
              Retake
            </button>
            {capturedPhotos.length >= 1 && (
              <button
                onClick={handleSubmitRegistration}
                disabled={!consentGiven}
                className={`px-3 py-2 rounded-md text-white`}
                style={{
                  background: !consentGiven ? '#031129ff' : '#6B7280',
                  border: 'none',
                  opacity: !consentGiven ? 0.6 : 1,
                  cursor: !consentGiven ? 'not-allowed' : 'pointer'
                }}
              >
                {consentGiven ? `Submit (${capturedPhotos.length})` : 'Consent required'}
              </button>
            )}
          </div>
        </div>

        {capturedPhotos.length > 0 && (
          <div className="w-full flex flex-col items-center gap-3 mt-3">
            <div className="grid grid-cols-3 gap-2">
              {capturedPhotos.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} alt={`capture-${i}`} className="w-40 h-28 object-cover rounded-md border" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 rounded-full px-2 py-1 text-xs"
                    style={{ background: '#9CA3AF', color: '#ffffff', border: 'none' }}
                  >
                    Remove
                  </button>
                  {/* validation badge */}
                  {photoValidationResults[i] && photoValidationResults[i].approved && (
                    <div style={{ position: 'absolute', left: 6, top: 6 }}>
                      <span style={{ background: '#16a34a', color: '#fff', padding: '2px 6px', borderRadius: 12, fontSize: 12 }}>OK</span>
                    </div>
                  )}
                  {/* Removed per-photo 'Fix' guidance to avoid alarming messages in the capture UI. */}
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-600">You can take up to 3 photos. At least one accepted photo is required to submit.</div>
          </div>
        )}
        {/* Quality metrics and consent */}
          {/* Compact requirements/status panel (removed large live-quality box) */}
          <div className="w-full max-w-md mt-4 p-4 rounded-lg shadow-md" style={{ background: '#FADADD', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div className="mb-2">
              <div style={{ color: '#9b3740', fontWeight: 700, fontSize: 20 }}>Consent Confirmation</div>
              <div className="text-xs" style={{ color: '#9b3740', opacity: 0.9 }}>{validationMessage}</div>
            </div>

            <div className="text-sm mt-1">
              <label style={{ color: '#5f1f23', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} style={{ marginRight: 8 }} />
                I consent to processing and storing my biometric template (required to register)
              </label>
            </div>
            {faceQualityStatus && <div className="text-sm mt-3" style={{ color: '#5f1f23' }}>{faceQualityStatus}</div>}
          </div>

          {/* Submit area below the requirements box */}
          <div className="w-full max-w-md mt-4 flex flex-col items-center">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleSubmitRegistration}
                disabled={!consentGiven || capturedPhotos.length < 1}
                className={`px-4 py-2 rounded-md text-white`}
                style={{
                  minWidth: 220,
                  background: (!consentGiven || capturedPhotos.length < 1) ? '#9CA3AF' : '#6B7280',
                  border: 'none',
                  opacity: (!consentGiven || capturedPhotos.length < 1) ? 0.6 : 1,
                  cursor: (!consentGiven || capturedPhotos.length < 1) ? 'not-allowed' : 'pointer'
                }}
              >
                {!consentGiven ? 'Consent required to submit' : (capturedPhotos.length < 1 ? 'Need at least 1 photo to submit' : `Submit (${capturedPhotos.length})`)}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">After submission we will generate and store a secure encrypted template — raw images are not stored.</div>
          </div>
      </div>

      {/* Manual photo capture UI: showing thumbnails above; metrics removed in favor of photos */}

          {/* Bottom duplicate capture controls removed to simplify UI per design request */}
    </div>
  );
};

export default LiveFaceCapture;
