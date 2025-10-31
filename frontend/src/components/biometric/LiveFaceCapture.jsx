import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
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

      // Prepare new captured array locally so we can immediately validate
      let next = [];
      setCapturedPhotos(prev => {
        next = [...prev];
        if (next.length < 5) next.push(imageSrc);
        return next;
      });

      setFaceQualityStatus(`Photo captured (${Math.min(next.length, 5)}/3)`);

      // Immediately validate this photo using strict quality check
      try {
          const res = await axios.post('/api/biometrics/face/quality-check', { image: imageSrc }, { headers: { 'Content-Type': 'application/json' } });
          // microservice returns { approved: bool, message, details: { ...flags } }
          // Some older/alternate endpoints may return success or different shapes; derive approval conservatively.
          const payload = res.data || {};
          let ok = false;
          let details = payload.details || payload || null;

          if (typeof payload.approved === 'boolean') {
            ok = payload.approved === true;
          } else if (typeof payload.success === 'boolean') {
            ok = payload.success === true;
          } else if (details) {
            // Fallback: consider OK when key failure flags are not explicitly false
            const noFace = details.face_detected === false;
            const obstruction = details.no_obstructions === false || details.obstruction === true;
            const glasses = details.no_glasses === false || details.glasses === true;
            const neutral = details.neutral_expression === false || details.smile === true || details.showing_teeth === true;
            const forward = details.forward_facing === false || details.pose && /turned|angled/i.test(details.pose);
            ok = !noFace && !obstruction && !glasses && !neutral && !forward;
          } else {
            ok = false;
          }
        setPhotoValidationResults(prev => {
          const p = [...(prev || [])];
          // push corresponding validation result
          p.push({ approved: ok, details, message: payload?.message || (ok ? 'OK' : 'Failed') });
          return p;
        });

        if (!ok) {
          setFaceQualityStatus('Captured photo failed validation. See guidance.');
          setValidationDetails(details);
          setValidationMessage(getSpecificGuidance(details));
        }
      } catch (valErr) {
        // validation error — mark as failed
        setPhotoValidationResults(prev => {
          const p = [...(prev || [])];
          p.push({ approved: false, details: null, message: valErr.message });
          return p;
        });
        setFaceQualityStatus('Validation service error. Please try again.');
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
        const res = await axios.post(
          '/api/biometrics/face/quality-check',
          { image: img },
          { headers: { 'Content-Type': 'application/json' }, signal: controller.signal }
        );

        if (isCancelled) return;
        const payload = res.data || {};
        const metrics = payload?.details || null;
        // Keep older captureQuality fields if microsvc returns lighting/metrics
        if (payload.lighting) setCaptureQuality(prev => ({ ...prev, brightness: payload.lighting.brightness / 255.0, contrast: payload.lighting.contrast / 255.0 }));
        setValidationDetails(metrics);
        setValidationMessage(payload.message || (payload.approved ? 'All checks passed' : 'Adjust your face'));

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
    if (!details) return 'Face capture failed. Please follow the guidelines and try again.';
    if (details.multiple_faces) return 'Multiple faces detected. Make sure only one person is in the frame.';
    if (details.face_detected === false) return 'No face detected. Position your face fully inside the box.';
    if (details.no_obstructions === false) return 'Remove masks, scarves, or anything covering your nose or mouth.';
    if (details.no_glasses === false) return 'Please remove sunglasses or eyewear for registration.';
    if (details.neutral_expression === false) return 'Maintain a neutral expression — no smiles or pouts.';
    if (details.proper_lighting === false) return 'Improve lighting on your face (avoid backlight or heavy shadows).';
    if (details.forward_facing === false) return 'Face slightly turned — please face the camera directly.';
    // fallback
    return 'Face capture failed. Make sure your face is centered, visible, and well lit.';
  }

  const handleSubmitRegistration = async () => {
    // Validate every captured photo before submitting
    if (!consentGiven) {
      setFaceQualityStatus('Consent is required to submit');
      return;
    }
    if (capturedPhotos.length < 3) {
      setFaceQualityStatus('Please capture at least 3 photos');
      return;
    }

    setFaceQualityStatus('Validating photos...');
    const results = [];
    const failures = [];
    for (let i = 0; i < capturedPhotos.length; i++) {
      try {
        const res = await axios.post('/api/biometrics/face/quality-check', { image: capturedPhotos[i] }, { headers: { 'Content-Type': 'application/json' } });
        const ok = !!res.data?.approved;
        const details = res.data?.details || res.data || null;
        results.push({ approved: ok, details, message: res.data?.message || (ok ? 'OK' : 'Failed') });
        if (!ok) failures.push({ idx: i, details });
      } catch (err) {
        results.push({ approved: false, details: null, message: err.message });
        failures.push({ idx: i, error: err.message });
      }
    }

    // store per-photo validation results so UI can show badges/hints
    setPhotoValidationResults(results);

    if (failures.length) {
      setFaceQualityStatus('One or more photos failed validation. See guidance below.');
      // show guidance for first failure
      const first = failures[0];
      setValidationDetails(first.details || { message: first.error });
      setValidationMessage(getSpecificGuidance(first.details || {}));
      return;
    }

    // all good
    setFaceQualityStatus('Validation passed — submitting');
    onCapture(capturedPhotos);
  };

  // Auto-capture when centered and held still for 2s
  useEffect(() => {
    if (!isCentered || !cameraReady) {
      setAutoCaptureCountdown(null);
      return;
    }
    // start countdown if fewer than 5 photos
    if (capturedPhotos.length >= 5) return;
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
  const readyToCapture = cameraReady && !isCapturing && capturedPhotos.length < 5;

  return (
    <div className="live-face-capture w-full flex flex-col items-center">
      {/* Short checklist for users */}
      <div className="biometric-checklist w-full max-w-md p-3 mb-4 rounded-md" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-muted)' }}>
        <ol style={{ paddingLeft: '1.1rem', margin: 0 }}>
          <div style={{ color: '#000000ffff', alignItems: 'center', fontWeight: 700, fontSize: 16 }}>RULES:</div>
          <li style={{ marginBottom: '0.6rem' }}><strong>1)</strong> Remove any mask or face covering.</li>
          <li style={{ marginBottom: '0.6rem' }}><strong>2)</strong> Position your face in the centered box on the camera preview — keep eyes visible.</li>
          <li style={{ marginBottom: '0.6rem' }}><strong>3)</strong> Look straight at the camera, no sunglasses or hats, neutral expression (do not show teeth).</li>
          <li style={{ marginBottom: '0.6rem' }}><strong>4)</strong> Make sure your ears, eyes, nose and mouth are clearly visible — avoid hair or clothing covering the ears.</li>
          <li style={{ marginBottom: '0.6rem' }}><strong>5)</strong> Take 3 photos from slightly different angles (left, center, right). Hold still for 2-3 seconds during capture.</li>
        </ol>
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
            <div className="pose-hint mb-1" style={{ color: 'var(--color-dark)', fontWeight: 600 }}>Take 3 photos for registration</div>
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
              disabled={isCapturing || !cameraReady || capturedPhotos.length >= 5}
              className={`px-4 py-2 rounded-md text-white font-semibold btn-primary ${isCapturing || !cameraReady || capturedPhotos.length >= 5 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
            >
              {isCapturing ? 'Capturing...' : 'Capture'}
            </button>
            <button
              onClick={retake}
              className="px-3 py-2 rounded-md btn-minimal"
              style={{ background: 'transparent' }}
            >
              Retake
            </button>
            {capturedPhotos.length >= 3 && (
              <button
                onClick={handleSubmitRegistration}
                disabled={!consentGiven}
                className={`px-3 py-2 rounded-md text-white btn-primary ${!consentGiven ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                    className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full px-2 py-1 text-xs"
                  >
                    Remove
                  </button>
                  {/* validation badge */}
                  {photoValidationResults[i] && (
                    <div style={{ position: 'absolute', left: 6, top: 6 }}>
                      {photoValidationResults[i].approved ? (
                        <span style={{ background: '#16a34a', color: '#fff', padding: '2px 6px', borderRadius: 12, fontSize: 12 }}>OK</span>
                      ) : (
                        <span style={{ background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: 12, fontSize: 12 }}>Fix</span>
                      )}
                    </div>
                  )}
                  {/* guidance text for failed photos */}
                  {photoValidationResults[i] && !photoValidationResults[i].approved && (
                    <div style={{ marginTop: 6, maxWidth: 160, color: '#b91c1c', fontSize: 12 }}>
                      {getSpecificGuidance(photoValidationResults[i].details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-600">You can take up to 5 photos. Minimum 3 required to submit.</div>
          </div>
        )}
        {/* Quality metrics and consent */}
          {/* Compact requirements/status panel (removed large live-quality box) */}
          <div className="w-full max-w-md mt-4 p-4 rounded-lg shadow-md" style={{ background: '#ffe6f0', border: '1px solid #ffd1e3' }}>
            <div className="mb-2 flex justify-between items-center">
              <div style={{ color: '#7a2d3a', fontWeight: 700, fontSize: 16 }}>Capture requirements</div>
              <div className="text-xs" style={{ color: '#7a2d3a', opacity: 0.8 }}>{validationMessage}</div>
            </div>

            {/* Only keep consent checkbox per design request */}
            <div className="text-sm mt-3">
              <label style={{ color: '#7a2d3a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} style={{ marginRight: 8 }} />
                I consent to processing and storing my biometric template (required to register)
              </label>
            </div>
            {faceQualityStatus && <div className="text-sm mt-3" style={{ color: '#7a2d3a' }}>{faceQualityStatus}</div>}
          </div>

          {/* Submit area below the requirements box */}
          <div className="w-full max-w-md mt-4 flex flex-col items-center">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleSubmitRegistration}
                disabled={!consentGiven || capturedPhotos.length < 3}
                className={`px-4 py-2 rounded-md text-white btn-primary ${!consentGiven || capturedPhotos.length < 3 ? 'opacity-60 cursor-not-allowed' : ''}`}
                style={{ minWidth: 220 }}
              >
                {!consentGiven ? 'Consent required to submit' : (capturedPhotos.length < 3 ? 'Need 3 photos to submit' : `Submit (${capturedPhotos.length})`)}
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
