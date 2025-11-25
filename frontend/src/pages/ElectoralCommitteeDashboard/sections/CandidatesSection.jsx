import React from 'react';
import { ArrowLeft, Plus, Eye, EyeOff, Edit2, Trash2, UserCheck, User, Users } from 'lucide-react';
import SearchInput from '../component/SearchInput';
import Pagination from '../component/Pagination';

const CandidatesSection = ({
  candidates,
  candidateCurrentPage,
  candidateTotalPages,
  candidateTotalItems,
  candidateItemsPerPage,
  candidateSearchQuery,
  candidatesLoading,
  selectedCandidate,
  showCandidateForm,
  candidateFormData,
  formErrors,
  candidateLoading,
  updatingCandidateId,
  deletingCandidateId,
  positions,
  showPassword,
  handleCandidatePageChange,
  handleCandidateSearch,
  handleCandidateItemsPerPageChange,
  handleCandidateSearchClear,
  setCandidateSearchQuery,
  setShowCandidateForm,
  handleCandidateInputChange,
  handleFile,
  handleCandidateSubmit,
  setShowPassword,
  handleCandidateClick,
  handleBack,
  handleEditCandidate,
  handleDeleteCandidate
}) => {
  if (showCandidateForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-indigo-500/90">Register New Candidate</h2>
          <button
            onClick={() => setShowCandidateForm(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Candidates
          </button>
        </div>

        {/* Candidate Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleCandidateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={candidateFormData.fullName}
                  onChange={handleCandidateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  placeholder="Enter full name"
                  maxLength={30}
                />
                {formErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={candidateFormData.email}
                  onChange={handleCandidateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  placeholder="Enter email address"
                  maxLength={40}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={candidateFormData.password}
                    onChange={handleCandidateInputChange}
                    className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
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
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>

              {/* Party Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Party Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="partyName"
                  required
                  value={candidateFormData.partyName}
                  onChange={handleCandidateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  placeholder="Enter party name"
                  maxLength={100}
                />
                {formErrors.partyName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.partyName}</p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  required
                  min="21"
                  max="100"
                  value={candidateFormData.age}
                  onChange={handleCandidateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  placeholder="Minimum 21 years"
                  maxLength={2}
                />
                {formErrors.age && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.age}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  required
                  value={candidateFormData.gender}
                  onChange={handleCandidateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {formErrors.gender && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.gender}</p>
                )}
              </div>   

              {/* Political Sign  */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Political Symbol <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="politicalSign"
                  onChange={handleFile}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  placeholder="Enter political symbol URL"
                />
                {formErrors.politicalSign && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.politicalSign}</p>
                )}
              </div>

              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  name="photo"
                  onChange={handleFile}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                />
                {formErrors.photo && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.photo}</p>
                )}
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position <span className="text-red-500">*</span>
                </label>
                <select
                  name="position"
                  required
                  value={candidateFormData.position}
                  onChange={handleCandidateInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                >
                  <option value="">Select Position</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
                {formErrors.position && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.position}</p>
                )}
              </div>

              {/* Manifesto */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manifesto <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="manifesto"
                  required
                  value={candidateFormData.manifesto}
                  onChange={handleCandidateInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
                  placeholder="Enter candidate's manifesto and promises"
                  maxLength={150}
                />
                {formErrors.manifesto && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.manifesto}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCandidateForm(false)}
                className="px-6 py-2 text-white border border-gray-300 bg-gray-500 hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={candidateLoading}
                className="px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {candidateLoading ? "Registering..." : "Register Candidate"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (selectedCandidate) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Candidates</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Candidate Photo and Basic Info */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <img
              src={selectedCandidate.photo  || "/default-profile.png"}
              alt={selectedCandidate.fullName}
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-200"
            />
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-semibold text-gray-800">{selectedCandidate.fullName}</h3>
              <p className="text-gray-600">{selectedCandidate.email}</p>
              <p className="text-blue-600 font-medium text-lg mt-1">{selectedCandidate.partyName }</p>
            </div>
          </div>

          {/* Candidate Details */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Position</p>
                <p className="text-lg font-semibold text-gray-800">{selectedCandidate.position}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Age</p>
                <p className="text-lg font-semibold text-gray-800">{selectedCandidate.age} years</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-lg font-semibold text-gray-800 capitalize">{selectedCandidate.gender}</p>
              </div>
            </div>

            {/* Political Symbol */}
            {selectedCandidate.politicalSign && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Political Symbol</p>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedCandidate.politicalSign}
                    alt="Political Symbol"
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{selectedCandidate.partyName}</p>
                    <p className="text-sm text-gray-600">Party Symbol</p>
                  </div>
                </div>
              </div>
            )}

            {/* Manifesto */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Manifesto</p>
              <p className="text-gray-700 leading-relaxed">{selectedCandidate.manifesto}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-indigo-500/90">Candidates</h2>
        <button
          onClick={() => setShowCandidateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Candidate
        </button>
      </div>

      {/* Search and Controls */}
      <SearchInput
        value={candidateSearchQuery}
        onChange={setCandidateSearchQuery}
        onSearch={handleCandidateSearch}
        onClear={handleCandidateSearchClear}
        placeholder="Search by candidate name or party..."
        itemsPerPage={candidateItemsPerPage}
        onItemsPerPageChange={handleCandidateItemsPerPageChange}
        itemsPerPageOptions={[5, 10, 15, 20]}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{candidateTotalItems}</p>
              <p className="text-sm text-gray-600">Total Candidates</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <User className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {candidates.filter(c => c.gender === 'male').length}
              </p>
              <p className="text-sm text-gray-600">Male Candidates</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-pink-500">
          <div className="flex items-center">
            <User className="w-8 h-8 text-pink-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {candidates.filter(c => c.gender === 'female').length}
              </p>
              <p className="text-sm text-gray-600">Female Candidates</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {candidates.filter(c => c.gender === 'other').length}
              </p>
              <p className="text-sm text-gray-600">Other</p>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0acbae]">Registered Candidates</h3>
          <div className="flex items-center gap-4">
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {candidateTotalItems} total candidates
            </span>
            <span className="text-sm text-gray-600">
              Page {candidateCurrentPage} of {candidateTotalPages}
            </span>
          </div>
        </div>

        {candidatesLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-8">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {candidateSearchQuery ? 'No candidates found matching your search.' : 'No candidates registered yet.'}
            </p>
            <p className="text-gray-400">
              {candidateSearchQuery ? 'Try adjusting your search terms.' : 'Candidates will appear here once registered.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((c) => (
                <div
                  key={c._id || c.id}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleCandidateClick(c)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={c.photo ||  "/default-profile.png"}
                        alt={c.fullName}
                        className="w-16 h-16 rounded-full object-cover border"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">{c.fullName}</h3>
                        <p className="text-blue-600 font-medium">{c.partyName }</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCandidate(c);
                        }}
                        disabled={updatingCandidateId === c._id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                        title="Edit Candidate"
                      >
                        {updatingCandidateId === c._id ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Edit2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCandidate(c._id);
                        }}
                        disabled={deletingCandidateId === c._id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                        title="Delete Candidate"
                      >
                        {deletingCandidateId === c._id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Position:</span> {c.position}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Party:</span> {c.partyName}
                    </p>
                    {c.politicalSign && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-600">Symbol:</span>
                        <img
                          src={c.politicalSign}
                          alt="Political Symbol"
                          className="w-8 h-8 object-cover rounded"
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {c.manifesto }
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={candidateCurrentPage}
              totalPages={candidateTotalPages}
              onPageChange={handleCandidatePageChange}
              totalItems={candidateTotalItems}
              itemsPerPage={candidateItemsPerPage}
              itemsName="candidates"
            />
          </>
        )}
      </div>
    </>
  );
};

export default CandidatesSection;