// src/api/axiosInstance.js
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "") ||
  "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Auto logout on token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
