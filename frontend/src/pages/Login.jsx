import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    idType: "citizenship",
    idNumber: "",
    voterid: "",
    role: "voter",
  });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (credentials.email && credentials.password) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userEmail", credentials.email);
      localStorage.setItem("userRole", credentials.role);

      if (credentials.role === "admin") {
        navigate("/admin-dashboard");
      } else if (credentials.role === "candidate") {
        navigate("/");
      } else {
        navigate("/");
      }
    } else {
      alert("Please fill in all required fields.");
    }
  };

  const handleBack = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Back Button */}
      <div className="w-full max-w-md mb-4">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t("back")}</span>
        </button>
      </div>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">{t("login")}</h2>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("email")} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            placeholder={t("emailPlaceholder")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("password")} <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder={t("passwordPlaceholder")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("role")} <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={credentials.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="voter">{t("voter")}</option>
            <option value="candidate">{t("candidate")}</option>
            <option value="admin">{t("admin")}</option>
          </select>
        </div>

        {/* ID Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("idType")} <span className="text-red-500">*</span>
          </label>
          <select
            name="idType"
            value={credentials.idType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          >
            <option value="citizenship">{t("citizenship")}</option>
            <option value="national">{t("national")}</option>
            <option value="passport">{t("passport")}</option>
          </select>
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {credentials.idType === "passport"
              ? t("passport")
              : credentials.idType === "national"
                ? t("national")
                : t("citizenship")}{" "}<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="idNumber"
            value={credentials.idNumber}
            onChange={handleChange}
            placeholder={t("idPlaceholder")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Voter ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("voterid")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="voterid"
            value={credentials.voterid}
            onChange={handleChange}
            placeholder={t("voteridPlaceholder")}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {t("login")}
        </button>
      </form>
    </div>
  );
};

export default Login;
