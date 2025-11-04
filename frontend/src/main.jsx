// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // Correct import path
import { AuthProvider } from './contexts/AuthContext'
import { BiometricProvider } from './contexts/BiometricContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BiometricProvider>
        <App />
      </BiometricProvider>
    </AuthProvider>
  </React.StrictMode>,
)
