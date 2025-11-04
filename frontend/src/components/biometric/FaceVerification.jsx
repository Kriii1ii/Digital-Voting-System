import React, { useState } from 'react';
import api from '../../api/api';

const FaceVerification = ({ apiUrl }) => {
  const [imageData, setImageData] = useState(null);
  const [status, setStatus] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  };

  const verify = async () => {
    if (!imageData) return;
    setStatus('verifying');
    try {
      const res = await api.post('/biometrics/face/verify', { image_data: imageData });
      const json = res.data || {};
      setStatus(json?.success ? 'verified' : 'not-verified');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div>
      <h4>Face verification</h4>
      <input type="file" accept="image/*" onChange={handleFile} />
      {imageData && <img src={imageData} alt="preview" style={{ maxWidth: 240 }} />}
      <div>
        <button onClick={verify} disabled={!imageData}>Verify</button>
      </div>
      {status && <div>Status: {status}</div>}
    </div>
  );
};

export default FaceVerification;
