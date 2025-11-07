import axios from "axios";

// Allow overriding backend URL via Vite env var VITE_API_URL (e.g. http://localhost:5001)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create a reusable axios instance
const api = axios.create({
  baseURL: `${API_BASE}/api`, // backend base URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;


