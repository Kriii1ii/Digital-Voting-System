// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";

import Heropg from "./components/heropg";
import Registration from "./components/Registration";

import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import AdminDashboard from "./pages/AdminDashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import ElectoralCommitteeDashboard from "./pages/ElectoralCommitteeDashboard";
import VoterDashboard from "./pages/VoterDashboard";
import Votes from "./pages/Votes";
import CandidatesList from "./pages/CandidatesList";
import VotersList from "./pages/VotersList";
import Login from "./pages/Login";

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Heropg />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />

          {/* Admin Dashboard */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-dashboard/votes" element={<Votes />} />
          <Route path="/admin-dashboard/candidates" element={<CandidatesList />} />
          <Route path="/admin-dashboard/voters" element={<VotersList />} />

          {/* Candidate Dashboard */}
          <Route path="/candidate-dashboard" element={<CandidateDashboard />} />

          {/* Voter Dashboard */}
          <Route path="/voter-dashboard" element={<VoterDashboard />} />

          {/* Electoral Committee Dashboard */}
          <Route
            path="/electoral-committee-dashboard"
            element={<ElectoralCommitteeDashboard />}
          />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
