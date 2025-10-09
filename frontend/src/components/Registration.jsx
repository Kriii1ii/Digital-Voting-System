import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import NepaliDatePicker from '@sbmdkl/nepali-datepicker-reactjs';
import '@sbmdkl/nepali-datepicker-reactjs/dist/index.css';

const Registration = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    password: '',
    idType: 'citizenship', // default selection
    idNumber: '',
    voterid: '',
    province: '',
    district: '',
    ward: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (value) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);

    navigate('/login');
  };

  const handleBack = () => {
    navigate('/');
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

          {/* Header */}
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
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder={t('fullNamePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                {/* Date of Birth */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dateOfBirth')} *
                  </label>
                  {language === 'np' ? (
                    <NepaliDatePicker
                      value={formData.dateOfBirth}
                      onChange={handleDateChange}
                      className="np-datepicker"
                      placeholder={t('dateOfBirth')}
                      required
                    />
                  ) : (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  )}
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('phone')} *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t('phonePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("email")} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t("emailPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                {/* Password */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("password")} *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t("passwordPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                {/* ID Type Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("idType")} *
                  </label>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
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
                        : t("citizenshipNumber")}{" "}
                    *
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    placeholder={t("idPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                {/* Voter ID */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("voterid")} *
                  </label>
                  <input
                    type="voterid"
                    name="voterid"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t("voteridPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                {/* Province */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('province')} *
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
                  >
                    <option value="">{t('selectProvince')}</option>
                    {t('provinces').map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('district')} *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder={t("districtPlaceholder")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                {/* Ward Number */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('ward')} *
                  </label>
                  <input
                    type="number"
                    name="ward"
                    value={formData.ward}
                    onChange={handleInputChange}
                    placeholder={t("wardPlaceholder")}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>
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
