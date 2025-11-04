import React from 'react';

// Fingerprint support is deprecated in this project (face-only flows used).
// This lightweight component is a placeholder to keep imports stable.

const FingerprintSensor = ({ onRegister }) => {
  return (
    <div className="fingerprint-sensor p-4 rounded-md bg-white shadow-sm">
      <h3 style={{ fontWeight: 700 }}>Fingerprint sensor (deprecated)</h3>
      <p className="text-sm text-gray-600">Fingerprint support is not active in this build. Use face capture instead.</p>
      <div className="mt-3">
        <button
          className="px-3 py-1 rounded bg-indigo-600 text-white"
          onClick={() => onRegister && onRegister(new Error('Fingerprint not supported'))}
        >
          Try fingerprint
        </button>
      </div>
    </div>
  );
};

export default FingerprintSensor;
