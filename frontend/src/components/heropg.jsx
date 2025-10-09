import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const LanguageSelection = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen flex flex-col relative bg-cover bg-center"
      style={{ backgroundImage: "url('/vote.webp')" }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-6 relative z-10">
        <div className="font-bold text-4xl text-white">{t("secureVoting")}</div>

        <nav className="flex items-center space-x-6 text-white font-medium">
          <button
            onClick={() => navigate("/about")}
            className="hover:text-blue-300 transition"
          >
            {t("aboutUs")}
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="hover:text-blue-300 transition"
          >
            {t("contactUs")}
          </button>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="ml-4 px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition font-medium"
          >
            <option value="en">English</option>
            <option value="np">नेपाली</option>
          </select>

          {!isLoggedIn ? (
            <button
              onClick={() => navigate("/register")}
              className="ml-4 px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition font-medium"
            >
              {t("loginRegister")}
            </button>
          ) : (
            <>
              {/* Features for logged-in users */}
              <button
                onClick={() => navigate("/vote")}
                className="ml-4 px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition font-medium"
              >
                Vote Now
              </button>
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition font-medium"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </header>
    </div>
  );
};

export default LanguageSelection;
