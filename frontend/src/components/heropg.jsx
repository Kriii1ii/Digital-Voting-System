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
      className="min-h-screen relative bg-cover bg-center flex flex-col"
      style={{ backgroundImage: "url('/vote.webp')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <header className="relative z-10">
        <nav className="flex justify-between items-center px-6 md:px-10 py-2 bg-blue-50 shadow-md rounded-b-lg">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="Voting System Logo"
              className="h-20 w-auto object-contain cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>

          <div className="hidden md:flex items-center space-x-10 font-semibold">
            <button
              onClick={() => navigate("/")}
              className="text-gray-900 text-lg hover:text-blue-500 transition"
            >
              {t("home")}
            </button>
            <button
              onClick={() => navigate("/about")}
              className="text-gray-900 text-lg hover:text-blue-500 transition"
            >
              {t("aboutUs")}
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="text-gray-900 text-lg hover:text-blue-500 transition"
            >
              {t("contactUs")}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
              aria-label="Select Language"
            >
              <option value="en">English</option>
              <option value="np">नेपाली</option>
            </select>

            {!isLoggedIn ? (
              <button
                onClick={() => navigate("/register")}
                className="px-3 py-1 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                {t("loginRegister")}
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate("/vote")}
                  className="px-3 py-1 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Vote Now
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <div className="flex-1 flex flex-col justify-start items-center text-center px-4  pt-38 z-10 relative">
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-4">
          {t("welcome")}
        </h1>
        <p className="text-lg md:text-2xl text-white max-w-3xl pt-5 text-right leading-relaxed mb-6 drop-shadow-md">
          {t("nayamat")}
        </p>

      </div>

      <div className="text-center py-4 border-t border-white text-sm text-white">
        {t("nayamatfooter")}
      </div>

    </div>
  );
};

export default LanguageSelection;
