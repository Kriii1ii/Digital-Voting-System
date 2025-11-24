import React from 'react';

const ElectionsSection = ({
  elections,
  editingId,
  editedDates,
  handleEditedDatesChange,
  handleUpdateElection,
  handleDeleteElection,
  setEditingId,
  setEditedDates,  
  calculateEndDate
}) => {
  
  const handleEditClick = (election) => {
    setEditingId(election._id);
    setEditedDates({
      startDate: election.startDate.split('T')[0],
      endDate: election.endDate.split('T')[0],
    });
  };

  const handleEditedStartDateChange = (e) => {
    const { value } = e.target;
    handleEditedDatesChange('startDate', value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-indigo-500/90">Elections Management</h2>
      </div>

       {/* Election Statistics */}
      {elections.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-[#0acbae] mb-4">Election Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{elections.length}</p>
                  <p className="text-sm text-gray-600">Total Elections</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {elections.filter(e => new Date(e.startDate) > new Date()).length}
                  </p>
                  <p className="text-sm text-gray-600">Upcoming Elections</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {elections.filter(e => new Date(e.startDate) <= new Date() && new Date(e.endDate) >= new Date()).length}
                  </p>
                  <p className="text-sm text-gray-600">Active Elections</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0acbae]">All Elections</h3>
          <div className="flex items-center gap-4">
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
              {elections.length} total elections
            </span>
          </div>
        </div>

        {elections.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-gray-500 text-lg">No elections created yet.</p>
            <p className="text-gray-400">Elections will appear here once created in the Dashboard section.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.map((election) => (
              <div
                key={election._id || election.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-blue-900">{election.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    new Date(election.endDate) < new Date() 
                      ? 'bg-red-100 text-red-800' 
                      : new Date(election.startDate) > new Date()
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {new Date(election.endDate) < new Date() 
                      ? 'Completed' 
                      : new Date(election.startDate) > new Date()
                      ? 'Upcoming'
                      : 'Active'
                    }
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">
                      {new Date(election.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">
                      {new Date(election.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {Math.ceil((new Date(election.endDate) - new Date(election.startDate)) / (1000 * 60 * 60 * 24))} days
                    </span>
                  </div>
                </div>

                {editingId === election._id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Start Date
                      </label>
                      <input
                        type="date"
                        value={editedDates.startDate}
                        onChange={handleEditedStartDateChange}
                        min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                        className="w-full border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New End Date (Auto-calculated)
                      </label>
                      <input
                        type="date"
                        value={calculateEndDate(editedDates.startDate)}
                        className="w-full border border-gray-300 p-2 rounded text-sm bg-gray-100 focus:outline-none"
                        disabled
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdateElection(election._id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(election)} 
                      className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleDeleteElection(election._id)}
                      className="flex-1 bg-[#ff5154] hover:bg-[#fc161a] text-white px-3 py-2 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ElectionsSection;