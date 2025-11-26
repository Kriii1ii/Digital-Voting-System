import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { loginUser } from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCredentials(prev => ({
      ...prev,
      [name]: name === "password"
        ? value.slice(0, 30)
        : value.slice(0, 40)
    }));
  };

  const validateForm = () => {
    const errs = {};

    if (!credentials.email.trim()) errs.email = "Email is required";
    else if (!credentials.email.includes("@")) errs.email = "Invalid email";
    else if (credentials.email.length > 40) errs.email = "Max 40 characters";

    if (!credentials.password) errs.password = "Password is required";
    else if (credentials.password.length < 6)
      errs.password = "Min 6 characters";
    else if (credentials.password.length > 30)
      errs.password = "Max 30 characters";

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      console.log("Sending request:", credentials);

      const res = await loginUser(credentials);

      console.log("Backend response:", res);

      const token = res.token;
      const userData = res;

      if (!token || !userData) {
        throw new Error("Invalid response from server");
      }

      // Save user in context
      login(token, userData, true);

      const roleDashboardMap = {
        admin: "/admin-dashboard",
        candidate: "/candidate-dashboard",
        electoral_committee: "/electoral-committee-dashboard",
        voter: "/voter-dashboard",
      };

      navigate(roleDashboardMap[userData.role] || "/voter-dashboard");

    } catch (err) {
      console.error("Login error:", err);
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Login failed. Please try again."
      );
    }
  };

  const handleBack = () => navigate("/");

  const isAlreadyLoggedIn = !!user;

  useEffect(() => {
    if (isAlreadyLoggedIn) {
      const dashboards = {
        admin: "/admin-dashboard",
        candidate: "/candidate-dashboard",
        electoral_committee: "/electoral-committee-dashboard",
        voter: "/voter-dashboard",
      };

      navigate(dashboards[user?.role] || "/voter-dashboard");
    }
  }, [isAlreadyLoggedIn, user, navigate]);

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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500"
            maxLength={40}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("password")} <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder={t("passwordPlaceholder")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 pr-10"
              maxLength={30}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          </div>

          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          className="w-20 bg-blue-800 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          {t("login")}
        </button>

        <p className="text-left text-sm">
          {t("noAccount")}?
          <Link to="/register" className="text-blue-600 underline ml-1">
            {t("register")}
          </Link>
        </p>

        <p className="text-left text-sm">
          {t("registeredasCandidate")}?
          <Link to="/loginCandidate" className="text-blue-600 underline ml-1">
            {t("Login")}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
