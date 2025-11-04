import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const Heropg = () => {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [heroContent] = useState({
    title: "",
    description: "",
  });


  return (
    <div className="flex flex-col min-h-screen">
      <div
        className="relative flex flex-col w-full"
        style={{
          minHeight: "120vh",
          backgroundImage: "url('/vote.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40 z-0">
        </div>

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
              >
                <option value="en">{t("english")}</option>
                <option value="np">{t("nepali")}</option>
              </select>

              <button
                onClick={() => navigate("/register")}
                className="px-3 py-1 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                {t("loginRegister")}
              </button>
            </div>
          </nav>
        </header>

        <div className="flex-1 flex flex-col justify-start items-center px-4 z-10 relative pt-32 md:pt-40">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-4 text-center">
            {heroContent.title || t("welcome")}
          </h1>
          <p className="text-lg md:text-2xl text-white max-w-3xl pt-4 leading-relaxed drop-shadow-md text-left mx-auto">
            {heroContent.description || t("nayamat")}
          </p>
        </div>
      </div>

      <footer className="w-full bg-blue-100 border-t border-black">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start gap-6 p-4 text-gray-700">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-blue-900 mb-2">{t("nayaMat")}</h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm">{t("nayaMatpart")}</p>
          </div>

          <div className="flex-1">
            <h3 className="text-sm text-blue-800 font-semibold mb-2">{t("intouch")}</h3>
            <p className="text-xs mb-1"><span className="font-medium">{t("email")}:</span> support@nayamat.com</p>
            <p className="text-xs mb-1"><span className="font-medium">{t("phone")}:</span> {t("num")}</p>
            <p className="text-xs"><span className="font-medium">{t("address")}:</span> {t("add")}</p>
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
