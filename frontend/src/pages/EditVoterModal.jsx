import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { updateVoter } from "../api/endpoints";

const EditVoterModal = ({ voter, onClose, onUpdate }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ ...voter });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    if (!formData.fullname?.trim()) errors.fullname = t("fullNameRequired") || "Full name is required";
    if (!formData.email?.trim()) errors.email = t("emailRequired") || "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = t("invalidEmail") || "Invalid email address";
    if (!formData.phone?.trim()) errors.phone = t("phoneRequired") || "Phone is required";
    else if (!/^\d{10}$/.test(formData.phone)) errors.phone = t("invalidPhone") || "Phone must be 10 digits";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setLoading(true);
      try {
        const response = await updateVoter(formData._id, formData);
        console.log("Voter updated:", response);
        onUpdate(response);
        onClose();
      } catch (error) {
        console.error("Update failed:", error);
        alert(error.response?.data?.message || "Failed to update voter. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-gray-300">
        <h2 className="text-2xl font-bold mb-6">
          {t("edit")} {t("voter")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className={`w-full border rounded-md p-2 ${formErrors.fullname ? "border-red-500" : ""}`}
              required
            />
            {formErrors.fullname && <p className="text-red-500 text-sm mt-1">{formErrors.fullname}</p>}
          </div>

          {/* Email */}
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
              className={`w-full border rounded-md p-2 ${formErrors.email ? "border-red-500" : ""}`}
              required
            />
            {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("phone")}
            </label>
            <input
              name="phone"
              placeholder={t("phonePlaceholder")}
              value={formData.phone}
              onChange={handleChange}
              className={`w-full border rounded-md p-2 ${formErrors.phone ? "border-red-500" : ""}`}
              required
            />
            {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
          </div>

          {/* Buttons */}
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
              disabled={loading}
              className={`bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? t("updating") || "Updating..." : t("update")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVoterModal;
