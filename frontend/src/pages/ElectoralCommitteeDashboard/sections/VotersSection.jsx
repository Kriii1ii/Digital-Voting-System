import React from 'react';
import { Users, UserCheck, User } from 'lucide-react';
import SearchInput from '../component/SearchInput';
import Pagination from '../component/Pagination';

const VotersSection = ({
  voters,
  voterCurrentPage,
  voterTotalPages,
  voterTotalItems,
  voterItemsPerPage,
  voterSearchQuery,
  votersLoading,
  handleVoterPageChange,
  handleVoterSearch,
  handleVoterItemsPerPageChange,
  handleVoterSearchClear,
  setVoterSearchQuery
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-indigo-500/90">Voter List</h2>
      </div>

      {/* Search and Controls */}
      <SearchInput
        value={voterSearchQuery}
        onChange={setVoterSearchQuery}
        onSearch={handleVoterSearch}
        onClear={handleVoterSearchClear}
        placeholder="Search by name or voter ID..."
        itemsPerPage={voterItemsPerPage}
        onItemsPerPageChange={handleVoterItemsPerPageChange}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{voterTotalItems}</p>
              <p className="text-sm text-gray-600">Total Voters</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {voters.filter(v => v.verified).length}
              </p>
              <p className="text-sm text-gray-600">Verified Voters</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <User className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {voters.filter(v => !v.verified).length}
              </p>
              <p className="text-sm text-gray-600">Pending Verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Voters Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0acbae]">Registered Voters</h3>
          <div className="flex items-center gap-4">
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {voterTotalItems} total voters
            </span>
            <span className="text-sm text-gray-600">
              Page {voterCurrentPage} of {voterTotalPages}
            </span>
          </div>
        </div>

        {votersLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2">Loading voters...</p>
          </div>
        ) : voters.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {voterSearchQuery ? 'No voters found matching your search.' : 'No voters registered yet.'}
            </p>
            <p className="text-gray-400">
              {voterSearchQuery ? 'Try adjusting your search terms.' : 'Voters will appear here once registered.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Voter ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">National ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date of Birth</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((v) => (
                    <tr key={v._id || v.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="font-medium text-gray-800">{v.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{v.voterId}</td>
                      <td className="py-3 px-4 text-gray-600">{v.nationalId || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {v.dateOfBirth ? new Date(v.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          v.verified 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            v.verified ? "bg-green-400" : "bg-yellow-400"
                          }`}></div>
                          {v.verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={voterCurrentPage}
              totalPages={voterTotalPages}
              onPageChange={handleVoterPageChange}
              totalItems={voterTotalItems}
              itemsPerPage={voterItemsPerPage}
              itemsName="voters"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default VotersSection;