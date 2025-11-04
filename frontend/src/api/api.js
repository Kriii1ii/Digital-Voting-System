// src/api/api.js
import axios from "axios";

// Allow overriding backend URL via Vite env var VITE_API_URL (e.g. http://localhost:5001)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Create a reusable axios instance
const api = axios.create({
  baseURL: `${API_BASE}/api`, // backend base URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Automatically attach token if logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
