// frontend/src/components/biometric/BiometricStatus.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const BiometricStatus = () => {
  const { user, token } = useAuth();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`/api/biometrics/status/${user?._id || user?.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatus(res.data?.data);
      } catch (err) {
        console.error('Biometric status error:', err);
        setError(err.response?.data?.message || err.message);
      }
    };

    if (user && token) fetchStatus();
  }, [user, token]);

  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!status) return <div>Loading biometric status...</div>;

  return (
    <div className="p-4 border rounded-lg bg-white shadow-md mt-4">
      <h2 className="text-xl font-bold mb-2">Biometric Status</h2>
      <ul>
        <li>Face Registered: {status.faceRegistered ? '✅' : '❌'}</li>
        {typeof status.webAuthnRegistered !== 'undefined' && (
          <li>Security Key Registered: {status.webAuthnRegistered ? '✅' : '❌'}</li>
        )}
        <li>Last Verified: {status.lastVerified || 'N/A'}</li>
      </ul>
    </div>
  );
};

export default BiometricStatus;
