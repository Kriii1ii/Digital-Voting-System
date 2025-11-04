import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Shield } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import NepaliDatePicker from "@sbmdkl/nepali-datepicker-reactjs";
import "@sbmdkl/nepali-datepicker-reactjs/dist/index.css";
import BiometricChoice from './biometric/BiometricChoice';
import { registerUser } from "../api/endpoints";

const Registration = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState({
    role: "voter",
    fullName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    idType: "citizenship",
    idNumber: "",
    voterId: "",
    province: "",
    district: "",
    ward: ""
  });

  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [biometricData, setBiometricData] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "fullName") {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData((prev) => ({ ...prev, [name]: lettersOnly }));
    } else if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numbersOnly }));
    } else if (name === "district") {
      const lettersOnly = value.replace(/[^a-zA-Z]/g, "");
      setFormData((prev) => ({ ...prev, [name]: lettersOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (value) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: value }));
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
      // Proceed with registration (biometricData may be null if user didn't capture)
      setLoading(true);
      try {
        const response = await registerUser({ ...formData, biometricData });
        console.log("User registered successfully:", response);

          // If registration returned a user id and biometric data was provided, attempt to register the face(s)
          try {
            const userId = response?.data?.id || response?.data?._id || response?.id || null;
            if (userId && biometricData) {
              // prefer batch endpoint when multiple images provided
              const API_BASE = import.meta.env.VITE_API_URL || '';
              const images = Array.isArray(biometricData.data) ? biometricData.data : [biometricData.data];
              // call biometric register-batch (best-effort, do not block overall registration)
              await fetch(`${API_BASE}/api/biometrics/face/register-batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, images, consent: true }),
              }).then(res => res.json()).then(r => {
                if (!r || !r.success) console.warn('Biometric register-batch returned error', r);
              }).catch(err => console.warn('Biometric register-batch failed', err));
            }
          } catch (bioErr) {
            console.warn('Post-registration biometric upload failed (non-fatal):', bioErr);
          }

          alert(t("registrationSuccess") || "Registration successful!");
          navigate("/login");
      } catch (error) {
        console.error("Registration failed:", error);
          // Surface server message when available to help debugging / user feedback
          const serverMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
          alert(serverMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    navigate("/");
  };


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
                    value={formData.fullName}
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
                      value={formData.dateOfBirth}
                      onChange={handleDateChange}
                      className="np-datepicker"
                      placeholder={t('dateOfBirth')}
                    />
                  ) : (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
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
                    value={formData.phone}
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
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t("emailPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>

                {/* Password */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("password")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t("passwordPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                </div>

                {/*Comfirm Password */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("confirmPassword")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder={t("confirmPasswordPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  />
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
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="voter">{t("voter")}</option>
                    <option value="candidate">{t("candidate")}</option>
                    <option value="admin">{t("admin")}</option>
                    <option value="electrol committee">{t("electrolCommittee")}</option>
                  </select>
                </div>

                {/* ID Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("idType")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="citizenship">{t("citizenship")}</option>
                    <option value="national">{t("national")}</option>
                    <option value="passport">{t("passport")}</option>
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
                    value={formData.idNumber}
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
                    value={formData.voterId}
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
                    value={formData.province}
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
                    value={formData.district}
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
                    value={formData.ward}
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
                className="w-full bg-blue-800 text-white py-4 px-6 rounded-xl font-semibold hover:scale-[1.02] hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <Shield className="w-5 h-5" />
                <span>{t('register')}</span>
              </button>

              {/* Already registered */}
              <p className="text-center text-gray-600 text-sm mt-4 font-bold">
                {t('alreadyRegistered')} <br />
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-32 bg-blue-800 text-white py-2 px-4 mt-3 rounded-xl font-semibold hover:scale-[1.02] hover:shadow-lg"
                >
                  {t("login")}
                </button>
              </p>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;








