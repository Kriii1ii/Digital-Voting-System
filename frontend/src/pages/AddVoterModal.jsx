import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext"; 

const AddVoterModal = ({ onClose }) => {
  const { t } = useLanguage(); 
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("🧾 New Voter Added:", formData);
    alert(`Voter ${formData.fullname} added (frontend only)!`);
    onClose(); 
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">{t("addVoter")}</h2>

        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-between">
          <div>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("fullName")}
              </label>
              <input
                name="fullname"
                placeholder={t("fullNamePlaceholder")}
                value={formData.fullname}
                onChange={handleChange}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                {t("email")}
              </label>
              <input
                name="email"
                placeholder={t("emailPlaceholder")}
                value={formData.email}
                onChange={handleChange}
                type="email"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                {t("password")}
              </label>
              <input
                name="password"
                placeholder={t("passwordPlaceholder")}
                value={formData.password}
                onChange={handleChange}
                type="password"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                {t("phone")}
              </label>
              <input
                name="phone"
                placeholder={t("phonePlaceholder")}
                value={formData.phone}
                onChange={handleChange}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              {t("close")}
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVoterModal;
