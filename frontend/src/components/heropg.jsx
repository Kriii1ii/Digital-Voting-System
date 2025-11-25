import React, { useState, useEffect } from "react";
import Chatbot from "./chatbot";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { getElections } from "../api/endpoints";

const Heropg = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [heroContent] = useState({
    title: "",
    description: "",
  });

  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchElections = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching all elections...');

      const electionsData = await getElections();
      console.log('Raw elections response:', electionsData);

      let electionsArray = [];

      if (Array.isArray(electionsData)) {
        electionsArray = electionsData;
      } else if (electionsData && Array.isArray(electionsData.data)) {
        electionsArray = electionsData.data;
      } else if (electionsData && electionsData.elections) {
        electionsArray = electionsData.elections;
      } else if (electionsData && electionsData.success && Array.isArray(electionsData.data)) {
        electionsArray = electionsData.data;
      }

      console.log('All elections to display:', electionsArray);
      setElections(electionsArray);

    } catch (error) {
      console.error("Error fetching elections:", error);
      setError("Failed to load elections. Please try again later.");
      setElections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (elections.length > 0) {
      console.log('Elections loaded:', elections);
    }
  }, [elections]);

  const now = new Date();
  const ongoingElections = elections.filter(election => {
    try {
      const startDate = new Date(election.startDate);
      const endDate = new Date(election.endDate);
      return startDate <= now && endDate >= now;
    } catch (error) {
      console.error('Error parsing election dates:', error, election);
      return false;
    }
  });

  const upcomingElections = elections.filter(election => {
    try {
      const startDate = new Date(election.startDate);
      return startDate > now;
    } catch (error) {
      console.error('Error parsing election start date:', error, election);
      return false;
    }
  });

  const pastElections = elections.filter(election => {
    try {
      const endDate = new Date(election.endDate);
      return endDate < now;
    } catch (error) {
      console.error('Error parsing election end date:', error, election);
      return false;
    }
  });

  return (
    <div className="flex flex-col min-h-screen relative">
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/vote.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-blue-50 shadow-md rounded-b-lg">
        <nav className="flex flex-col md:flex-row justify-between items-center px-4 md:px-10 py-3">
          <div className="flex items-center mb-3 md:mb-0">
            <img
              src="/logo.png"
              alt="Voting System Logo"
              className="h-16 md:h-20 w-auto object-contain cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>

          <div className="flex items-center space-x-4 md:space-x-10 font-semibold mb-3 md:mb-0">
            <button
              onClick={() => navigate("/")}
              className={`text-sm md:text-lg transition ${location.pathname === "/" ? "text-blue-500" : "text-gray-900 hover:text-blue-500"
                }`}
            >
              {t("home")}
            </button>
            <button
              onClick={() => navigate("/about")}
              className={`text-sm md:text-lg transition ${location.pathname === "/about" ? "text-blue-500" : "text-gray-900 hover:text-blue-500"
                }`}
            >
              {t("aboutUs")}
            </button>
            <button
              onClick={() => navigate("/contact")}
              className={`text-sm md:text-lg transition ${location.pathname === "/contact" ? "text-blue-500" : "text-gray-900 hover:text-blue-500"
                }`}
            >
              {t("contactUs")}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-2 py-1 md:px-3 md:py-1 border border-gray-300 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium text-sm md:text-base"
            >
              <option value="en">{t("english")}</option>
              <option value="np">{t("nepali")}</option>
            </select>

            <button
              onClick={() => navigate("/login")}
              className="px-2 py-1 md:px-3 md:py-1 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium text-sm md:text-base"
            >
              {t("login")}
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative w-full mt-0 min-h-screen pt-20">
        <div className="flex-1 flex flex-col justify-start items-center px-4 pt-32 md:pt-40">
          <h1
            className="text-3xl md:text-8xl font-bold text-white drop-shadow-lg mb-4 text-center"
            style={{ fontFamily: "Cooper BT, serif" }}
          >
            {heroContent.title || t("welcome")}
          </h1>
          <p
            className="text-base md:text-2xl text-white max-w-3xl pt-4 leading-relaxed drop-shadow-md text-center mx-auto px-2"
            style={{ fontFamily: "Cooper BT, serif" }}
          >
            {heroContent.description || t("nayamat")}
          </p>
        </div>
      </div>

      {/* Elections Section */}
      <div className="w-full py-8 md:py-12 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg text-center mb-6 md:mb-8"
            style={{ fontFamily: "Cooper BT, serif" }}>
            {t("currentUpcoming")}
          </h2>

          {error && (
            <div className="text-center text-red-200 bg-red-900/80 p-4 rounded-lg mb-6 backdrop-blur-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-white py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="mt-2"> {t("loadingElections")}</p>
            </div>
          ) : elections.length === 0 ? (
            <div className="text-center text-white py-8 backdrop-blur-sm bg-black/30 rounded-lg max-w-2xl mx-auto">
              <p className="text-lg">{t("noElections")} </p>
              <p className="text-sm mt-2">{t("checkBackLater")}</p>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {/* Ongoing Elections */}
              {ongoingElections.length > 0 && (
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-white drop-shadow-md mb-4"
                    style={{ fontFamily: "Cooper BT, serif" }}>
                    {t("ongoingElections")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {ongoingElections.map((election) => (
                      <div
                        key={election._id || election.id}
                        className="bg-blue-50 backdrop-blur-sm rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-all duration-300 border border-white/20"
                      >
                        <h4 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                          {election.title}
                        </h4>
                        <p className="text-green-600 font-semibold mb-2">
                          🔴 {t("liveNow")}
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Started:</strong>{" "}
                            {new Date(election.startDate).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Ends:</strong>{" "}
                            {new Date(election.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        {user ? (
                          <button
                            onClick={() => navigate("/vote")}
                            className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
                          >
                            {t("voteNow")}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate("/login")}
                            className="mt-4 w-full bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm md:text-base"
                          >
                            {t("loginToVote")}   
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Elections */}
              {upcomingElections.length > 0 && (
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-white drop-shadow-md mb-4"
                    style={{ fontFamily: "Cooper BT, serif" }}>
                     {t("upcomingElections")}    
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {upcomingElections.map((election) => (
                      <div
                        key={election._id || election.id}
                        className="bg-blue-50 backdrop-blur-sm rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-all duration-300 border border-white/20"
                      >
                        <h4 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                          {election.title}
                        </h4>
                        <p className="text-blue-600 font-semibold mb-2">
                           {t("comingSoon")}    
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Starts:</strong>{" "}
                            {new Date(election.startDate).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Ends:</strong>{" "}
                            {new Date(election.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                          {t("checkBack")} 
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Elections (only show if no ongoing/upcoming) */}
              {pastElections.length > 0 && ongoingElections.length === 0 && upcomingElections.length === 0 && (
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-white drop-shadow-md mb-4">
                     {t("recentElections")} 
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {pastElections.slice(0, 3).map((election) => (
                      <div
                        key={election._id || election.id}
                        className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-all duration-300 border border-white/20"
                      >
                        <h4 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                          {election.title}
                        </h4>
                        <p className="text-gray-600 font-semibold mb-2">
                          ✅ {t("completed")} 
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Started:</strong>{" "}
                            {new Date(election.startDate).toLocaleDateString()}
                          </p>
                          <p>
                            <strong>Ended:</strong>{" "}
                            {new Date(election.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chatbot (only on hero page) */}
      <Chatbot />

      {/* Footer */}
      <footer className="w-full bg-blue-50 border-t border-black relative">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6 p-4 text-gray-700">
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-bold text-blue-900 mb-2">{t("NayaMat")}</h2>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-sm">{t("nayaMatpart")}</p>
          </div>

          <div className="flex-1">
            <h3 className="text-sm text-blue-800 font-semibold mb-2">{t("intouch")}</h3>
            <p className="text-xs mb-1">
              <span className="font-medium">{t("email")}:</span> support@nayamat.com
            </p>
            <p className="text-xs mb-1">
              <span className="font-medium">{t("phone")}:</span> {t("num")}
            </p>
            <p className="text-xs">
              <span className="font-medium">{t("address")}:</span> {t("add")}
            </p>
          </div>
        </div>

        <div className="text-center py-2 border-t border-black text-xs text-black">
          {t("nayamatfooter")}
        </div>
      </footer>
    </div>
  );
};

export default Heropg;