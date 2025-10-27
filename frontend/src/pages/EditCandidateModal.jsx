import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const EditCandidateModal = ({ candidate, onClose, onUpdate }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ ...candidate });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">
          {t("edit")} {t("candidate")}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fullName")}
          </label>
          <input
            name="fullname"
            placeholder={t("fullNamePlaceholder")}
            value={formData.fullname}
            onChange={handleChange}
            className="w-full border rounded-md p-2 mb-3"
            required
          />

          {/* Bio */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("bio")}
          </label>
          <textarea
            name="bio"
            placeholder={t("bioPlaceholder")}
            value={formData.bio}
            onChange={handleChange}
            rows={5}
            className="w-full border rounded-md p-2 mb-3 resize-none"
            required
          />

          {/* Photo Upload */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("photo")}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md cursor-pointer bg-white 
                      file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-1
                      file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 
                      hover:file:bg-gray-200"
          />

          {formData.photo && (
            <img
              src={formData.photo}
              alt="Preview"
              className="w-16 h-16 rounded-full object-cover border mt-3"
            />
          )}

          <div className="flex justify-between mt-5">
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

export default EditCandidateModal;
