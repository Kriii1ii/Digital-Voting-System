import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Shield, Eye, EyeOff } from "lucide-react"; 
import { useLanguage } from "../contexts/LanguageContext";
import NepaliDatePicker from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import BiometricChoice from './biometric/BiometricChoice';
import { registerUser } from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const Registration = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    role: "voter",
    fullName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    idType: "national",
    idNumber: "",
    voterId: "",
    province: "",
    district: "",
    ward: ""
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [biometricData, setBiometricData] = useState(null);
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "fullName") {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "").slice(0, 30);
      setFormData((prev) => ({ ...prev, [name]: lettersOnly }));

    } else if (name === "district") {
      const lettersOnly = value.replace(/[^a-zA-Z]/g, "").slice(0, 20);
      setFormData((prev) => ({ ...prev, [name]: lettersOnly }));

    } else if (name === "ward") {
      let numbersOnly = value.replace(/\D/g, "");
      if (numbersOnly) {
        let wardNum = parseInt(numbersOnly);
        if (wardNum <= 0) wardNum = 1;
        else if (wardNum > 32) wardNum = 32;
        numbersOnly = wardNum.toString();
      }
      setFormData((prev) => ({ ...prev, [name]: numbersOnly }));

    } else if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numbersOnly }));

    } else if (name === "password" || name === "confirmPassword") {
      setFormData((prev) => ({ ...prev, [name]: value.slice(0, 30) }));

    } else if (name === "idType") {
      setFormData((prev) => ({ ...prev, [name]: value.slice(0, 15) }));

    } else if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value.slice(0, 40) }));

    } else if (name === "voterId") {
      setFormData((prev) => ({ ...prev, [name]: value.slice(0, 13) }));

    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (value) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: value || "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.phone) errors.phone = "Phone is required";
    if (!/^\d{10}$/.test(formData.phone)) errors.phone = "Phone must be 10 digits";
    if (!formData.email.includes("@")) errors.email = "Invalid email address";
    if (formData.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (!formData.idNumber) errors.idNumber = "ID is required";
    if (!formData.voterId) errors.voterId = "Voter ID is required";
    if (!formData.province) errors.province = "Province is required";
    if (!formData.district.trim()) errors.district = "District is required";
    if (!formData.ward.trim()) errors.ward = "Ward Number is required";

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setLoading(true);

      try {
        // ✅ IMPORTANT: Register biometrics FIRST using voterId (before user account creation)
        if (biometricData) {
          const API_BASE = import.meta.env.VITE_API_URL || '';
          const images = Array.isArray(biometricData.data) ? biometricData.data : [biometricData.data];
          const voterId = formData.voterId; // Use voterId, not userId
          
          try {
            const bioRes = await fetch(`${API_BASE}/api/biometrics/face/register-batch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: voterId, images, consent: true }),
            });
            const bioData = await bioRes.json();
            if (!bioRes.ok || !bioData.success) {
              console.warn('Biometric registration failed (non-blocking)', bioData);
              // Continue with registration anyway - allows recovery if biometric service has issues
            } else {
              console.log('Biometric registration succeeded', bioData);
            }
          } catch (bioErr) {
            console.warn('Biometric registration error (non-blocking)', bioErr);
            // Continue - biometric service may be temporarily unavailable
          }
        }

        // Then register the user account
        const payload = {
          role: formData.role,
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          idType: formData.idType,
          idNumber: formData.idNumber,
          voterId: formData.voterId,
          province: formData.province,
          district: formData.district,
          ward: formData.ward,
          biometricData
        };

        // Register user
        const response = await registerUser(payload);
        console.log("User registered successfully:", response);

        alert(t("registrationSuccess") || "Registration successful!");
        navigate("/login");

      } catch (error) {
        console.error("Registration failed:", error);
        const serverMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
        alert(serverMessage);
      } finally {
        setLoading(false);
      }
    }
  };


  const handleBack = () => {
    navigate("/login");
  };

  const isAlreadyLoggedIn = !!user;

  useEffect(() => {
    if (isAlreadyLoggedIn) {
      if (user?.role === "admin") navigate("/admin-dashboard");
      else if (user?.role === "candidate") navigate("/candidate-dashboard");
      else if (user?.role === "committee") navigate("/electoral-committee-dashboard");
      else if (user?.role === "voter") navigate("/voter-dashboard");
    }
  }, [isAlreadyLoggedIn, user, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('back')}</span>
            </button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-800 rounded-full mb-3">
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('registration')}</h1>
            <p className="text-gray-600">{t('registrationSubtitle')}</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('fullName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleInputChange}
                    placeholder={t('fullNamePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {formErrors.fullName && <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>}
                </div>

                {/* Date of Birth */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dateOfBirth')} <span className="text-red-500">*</span>
                  </label>
                  {language === 'np' ? (
                    <NepaliDatePicker
                      value={formData.dateOfBirth || ""}
                      onChange={handleDateChange}
                      className="np-datepicker"
                      placeholder={t('dateOfBirth')}
                    />
                  ) : (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  )}
                  {formErrors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{formErrors.dateOfBirth}</p>}
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    placeholder={t('phonePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("email")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    placeholder={t("emailPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>

                {/* Password */}
                <div className="md:col-span-2 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("password")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password || ""}
                      onChange={handleInputChange}
                      placeholder={t("passwordPlaceholder")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="md:col-span-2 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("confirmPassword")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword || ""}
                      onChange={handleInputChange}
                      placeholder={t("confirmPasswordPlaceholder")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all pr-10"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>}
                </div>

                {/* Role */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-left">
                    {t("role")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="voter">{t("voter")}</option>
                    <option value="candidate">{t("candidate")}</option>
                  </select>
                </div>

                {/* ID Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("idType")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="idType"
                    value={formData.idType || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="national">{t("national")}</option>
                    
                  </select>
                </div>

                {/* ID Number */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.idType === "passport"
                      ? t("passport")
                      : formData.idType === "national"
                        ? t("national")
                        : t("citizenshipNumber")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber || ""}
                    onChange={handleInputChange}
                    placeholder={t("idPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {formErrors.idNumber && <p className="text-red-500 text-sm mt-1">{formErrors.idNumber}</p>}
                </div>

                {/* Voter ID */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("voterId")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="voterId"
                    value={formData.voterId || ""}
                    onChange={handleInputChange}
                    placeholder={t("voterIdPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {formErrors.voterId && <p className="text-red-500 text-sm mt-1">{formErrors.voterId}</p>}
                </div>

                {/* Province */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('province')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="province"
                    value={formData.province || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">{t('selectProvince')}</option>
                    {t('provinces').map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  {formErrors.province && <p className="text-red-500 text-sm mt-1">{formErrors.province}</p>}
                </div>

                {/* District */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('district')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district || ""}
                    onChange={handleInputChange}
                    placeholder={t("districtPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {formErrors.district && <p className="text-red-500 text-sm mt-1">{formErrors.district}</p>}
                </div>

                {/* Ward */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('ward')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="ward"
                    value={formData.ward || ""}
                    onChange={handleInputChange}
                    placeholder={t("wardPlaceholder")}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {formErrors.ward && <p className="text-red-500 text-sm mt-1">{formErrors.ward}</p>}
                </div>
              </div>
            </div>

            {/* Biometric Registration (embedded) */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 mb-6">
              <h3 className="text-lg font-semibold mb-4">{t('Biometric Registration')}</h3>
              <BiometricChoice
                mode="registration"
                onCompletion={(data) => {
                  setBiometricData(data);
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-800 text-white py-4 px-6 rounded-xl font-semibold hover:scale-[1.02] hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <Shield className="w-5 h-5" />
                <span>{t('register')}</span>
              </button>

              {/* Already registered */}
              <p className="text-center text-gray-600 text-sm mt-4 font-bold">
                {t('alreadyRegistered')} {" "}
                <Link
                  to="/login"
                  className="text-blue-600 underline hover:text-blue-800">
                  {t("login")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;