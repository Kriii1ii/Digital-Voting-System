import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { loginUser } from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    role: "voter",
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const validateForm = () => {
    const errs = {};
    if (!credentials.email.trim()) errs.email = "Email is required";
    else if (!credentials.email.includes("@")) errs.email = "Invalid email address";

    if (!credentials.password) errs.password = "Password is required";
    else if (credentials.password.length < 6)
      errs.password = "Password must be at least 6 characters";

    if (!credentials.role) errs.role = "Role is required";
    else if (!["voter", "candidate", "admin", "electoral_committee"].includes(credentials.role))
      errs.role = "Invalid role selected";

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      console.log("Sending request to backend...");
      const res = await loginUser(credentials);
      console.log("Backend response:", res);

      // ✅ extract correctly
      const { token, user } = res.data || {};

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      login(token, user, true);

      const roleDashboardMap = {
        admin: "/admin-dashboard",
        candidate: "/candidate-dashboard",
        electoral_committee: "/electoral-committee-dashboard",
        voter: "/voter-dashboard",
      };
      navigate(roleDashboardMap[user.role] || "/voter-dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials."
      );
    }

  };

  const handleBack = () => navigate("/register");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md mb-4">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t("back")}</span>
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center">{t("login")}</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

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
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
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
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Role */}
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
            <option value="electoral_committee">{t("electoralCommittee")}</option>
          </select>
          {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
        </div>

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
