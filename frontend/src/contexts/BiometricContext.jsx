import React, { createContext, useContext, useState } from 'react';

const BiometricContext = createContext(null);

export const BiometricProvider = ({ children }) => {
  const [method, setMethod] = useState(null); // 'face' | 'webauthn'
  const [verified, setVerified] = useState(false);

  return (
    <BiometricContext.Provider value={{ method, setMethod, verified, setVerified }}>
      {children}
    </BiometricContext.Provider>
  );
};

export const useBiometric = () => {
  const ctx = useContext(BiometricContext);
  if (!ctx) throw new Error('useBiometric must be used inside BiometricProvider');
  return ctx;
};

export default BiometricContext;
