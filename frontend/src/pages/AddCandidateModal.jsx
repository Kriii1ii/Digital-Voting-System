import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

const AddCandidateModal = ({ onClose, onAdd }) => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    fullname: "",
    bio: "",
    photo: "",
  });

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
    onAdd(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4">{t("addNewCandidate")}</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fullName")}
          </label>
          <input
            name="fullname"
            placeholder={t("fullNamePlaceholder")}
            value={formData.fullname}
            onChange={handleChange}
            className="w-full border p-2 rounded"
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
            className="w-full border p-2 rounded resize-none"
            required
          />

          {/* Photo Upload */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("uploadPhoto")}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md cursor-pointer bg-white 
                       file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 
                       file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 
                       hover:file:bg-gray-200 focus:outline-none"
          />

          {formData.photo && (
            <div className="flex justify-center mt-3">
              <img
                src={formData.photo}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover border shadow-sm"
              />
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
            >
              {t("close")}
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCandidateModal;
