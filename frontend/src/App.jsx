// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Contexts
import { LanguageProvider } from "./contexts/LanguageContext";

// Components & Pages
import LanguageSelection from "./components/heropg";
import Registration from "./components/Registration";
import Login from "./pages/Login";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import AdminDashboard from "./pages/AdminDashboard";
import Votes from "./pages/Votes";
import VotersList from "./pages/VotersList";
import CandidatesList from "./pages/CandidatesList";

// Biometric Components
import BiometricChoice from "./components/biometric/BiometricChoice";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LanguageSelection />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />

          {/* Biometric Route (for testing / registration flow) */}
          <Route
            path="/biometric"
            element={<BiometricChoice mode="registration" />}
          />

          {/* Admin Dashboard Nested Routes */}
          <Route path="/admin-dashboard" element={<AdminDashboard />}>
            <Route path="votes" element={<Votes />} />
            <Route path="voters" element={<VotersList />} />
            <Route path="candidates" element={<CandidatesList />} />
          </Route>

          {/* Optional: 404 fallback */}
          <Route
            path="*"
            element={
              <div style={{ textAlign: "center", marginTop: "4rem" }}>
                <h2>404 - Page Not Found</h2>
                <p>The page you’re looking for doesn’t exist.</p>
              </div>
            }
          />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
