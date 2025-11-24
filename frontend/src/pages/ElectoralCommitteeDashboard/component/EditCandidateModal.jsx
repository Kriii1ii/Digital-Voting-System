import React from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

const EditCandidateModal = ({
  showEditModal,
  setShowEditModal,
  editingCandidate,
  editFormData,
  editFormErrors,
  editLoading,
  showPassword,
  positions,
  handleEditInputChange,
  handleEditFile,
  handleEditSubmit,
  setShowPassword
}) => {
  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0  bg-opacity-30 backdrop-sm"
        onClick={() => setShowEditModal(false)}
      ></div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 relative z-10 border-2 border-blue-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
          <h3 className="text-2xl font-bold text-blue-800">Edit Candidate</h3>
          <button
            onClick={() => setShowEditModal(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleEditSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={editFormData.fullName}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
                maxLength={30}
              />
              {editFormErrors.fullName && (
                <p className="text-red-500 text-sm">{editFormErrors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={editFormData.email}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
                maxLength={40}
              />
              {editFormErrors.email && (
                <p className="text-red-500 text-sm">{editFormErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={editFormData.password}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  maxLength={30}
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
              {editFormErrors.password && (
                <p className="text-red-500 text-sm">{editFormErrors.password}</p>
              )}
            </div>

            {/* Party Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Party Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="partyName"
                required
                value={editFormData.partyName}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter party name"
                maxLength={15}
              />
              {editFormErrors.partyName && (
                <p className="text-red-500 text-sm">{editFormErrors.partyName}</p>
              )}
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                required
                min="21"
                max="100"
                value={editFormData.age}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
                placeholder="Minimum 21 years"
                maxLength={2}
              />
              {editFormErrors.age && (
                <p className="text-red-500 text-sm">{editFormErrors.age}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                required
                value={editFormData.gender}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {editFormErrors.gender && (
                <p className="text-red-500 text-sm">{editFormErrors.gender}</p>
              )}
            </div>

            {/* Political Sign */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Political Symbol <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="politicalSign"
                onChange={handleEditFile}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
              />
              {editFormData.politicalSign && (
                <p className="text-green-600 text-sm">Symbol selected</p>
              )}
              {editFormErrors.politicalSign && (
                <p className="text-red-500 text-sm">{editFormErrors.politicalSign}</p>
              )}
            </div>

            {/* Photo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Photo <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="photo"
                onChange={handleEditFile}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
              />
              {editFormData.photo && (
                <p className="text-green-600 text-sm">Photo selected</p>
              )}
              {editFormErrors.photo && (
                <p className="text-red-500 text-sm">{editFormErrors.photo}</p>
              )}
            </div>

            {/* Position */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Position <span className="text-red-500">*</span>
              </label>
              <select
                name="position"
                required
                value={editFormData.position}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Position</option>
                {positions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
              {editFormErrors.position && (
                <p className="text-red-500 text-sm">{editFormErrors.position}</p>
              )}
            </div>
          </div>

          {/* Manifesto */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Manifesto <span className="text-red-500">*</span>
            </label>
            <textarea
              name="manifesto"
              required
              value={editFormData.manifesto}
              onChange={handleEditInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter candidate's manifesto and promises"
              maxLength={150}
            />
            {editFormErrors.manifesto && (
              <p className="text-red-500 text-sm">{editFormErrors.manifesto}</p>
            )}
          </div>

          {(editingCandidate?.photo || editingCandidate?.politicalSign) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              {editingCandidate.photo && (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Photo</p>
                  <img
                    src={editingCandidate.photo}
                    alt="Current candidate"
                    className="w-32 h-32 object-cover rounded-lg mx-auto border"
                  />
                </div>
              )}
              {editingCandidate.politicalSign && (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Symbol</p>
                  <img
                    src={editingCandidate.politicalSign}
                    alt="Current political symbol"
                    className="w-32 h-32 object-cover rounded-lg mx-auto border"
                  />
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {editLoading ? "Updating..." : "Update Candidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCandidateModal;