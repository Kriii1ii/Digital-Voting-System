import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const EditVoterModal = ({ voter, onClose, onUpdate }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ ...voter });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-gray-300">
        <h2 className="text-2xl font-bold mb-6">{t("edit")} {t("voter")}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("fullName")}
            </label>
            <input
              name="fullname"
              placeholder={t("fullNamePlaceholder")}
              value={formData.fullname}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("email")}
            </label>
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("phone")}
            </label>
            <input
              name="phone"
              placeholder={t("phonePlaceholder")}
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
            >
              {t("close")}
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              {t("update")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVoterModal;
