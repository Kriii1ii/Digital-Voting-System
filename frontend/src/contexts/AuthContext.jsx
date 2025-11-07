import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  });

  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user") || sessionStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const [loading, setLoading] = useState(false);

  // ✅ Automatically set token header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // ✅ Login function
  const login = (newToken, userInfo, persist = true) => {
    setToken(newToken);
    setUser(userInfo || null);

    if (persist) {
      localStorage.setItem("token", newToken);
      if (userInfo) localStorage.setItem("user", JSON.stringify(userInfo));
    } else {
      sessionStorage.setItem("token", newToken);
      if (userInfo) sessionStorage.setItem("user", JSON.stringify(userInfo));
    }
  };

  // ✅ Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    delete axios.defaults.headers.common["Authorization"];
  };

  // ✅ Update Bio
  const updateBio = (newBio) => {
    setUser((prev) => {
      const updated = { ...prev, bio: newBio };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  // ✅ Update Profile Pic
  const updateProfilePic = (newUrl) => {
    setUser((prev) => {
      const updated = { ...prev, profilePic: newUrl };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        updateBio,
        updateProfilePic,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
