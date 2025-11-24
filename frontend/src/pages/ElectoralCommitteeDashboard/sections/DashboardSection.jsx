import React from 'react';

const DashboardSection = ({
  elections,
  newElection,
  editingId,
  editedDates,
  handleChange,
  handleCreateElection,
  handleEditedDatesChange,
  handleUpdateElection,
  handleDeleteElection,
  setEditingId,
  setEditedDates,  
  calculateEndDate
}) => {
  
  const handleLocationChange = (e) => {
    const { value } = e.target;
    handleChange({
      target: {
        name: 'title',
        value: value
      }
    });
  };

  const handleStartDateChange = (e) => {
    const { value } = e.target;
    handleChange({
      target: {
        name: 'startDate',
        value: value
      }
    });
  };

  const handleEditedStartDateChange = (e) => {
    const { value } = e.target;
    handleEditedDatesChange('startDate', value);
  };

  return (
    <div className="space-y-8">
      {/* Create Election Form */}
      <div className="bg-white border border-gray-300 p-6 mt-11 rounded-lg shadow-md max-w-md mx-auto space-y-5" 
      style={{ minHeight: "340px" }}>
        <h3 className="text-2xl font-bold text-blue-800 mb-4 text-center">Create New Election</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <label className="block text-md font-medium text-gray-700 w-1/3">
              Location:
            </label>
            <input
              type="text"
              name="title"
              placeholder="Enter Election Location"
              value={newElection.title}
              onChange={handleLocationChange}
              className="w-2/3 border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-600"
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
            />
          </div>

          <div className="flex items-center">
            <label className="text-md font-medium text-gray-700 w-1/3">
              Start Date:
            </label>
            <input
              type="date"
              name="startDate"
              value={newElection.startDate}
              onChange={handleStartDateChange}
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              className="w-2/3 border border-gray-300 p-2 rounded focus:outline-none focus:ring focus:ring-blue-600"
              onFocus={(e) => e.target.showPicker?.()}
            />
          </div>

          <div className="flex items-center">
            <label className="text-md font-medium text-gray-700 w-1/3">
              End Date:
            </label>
            <input
              type="date"
              name="endDate"
              value={newElection.endDate}
              onChange={handleChange}
              className="w-2/3 border border-gray-400 p-2 rounded focus:outline-none focus:ring focus:ring-blue-600 bg-gray-100"
              disabled
            />
          </div>
          <button
            onClick={handleCreateElection}
            className="w-full bg-blue-700 text-white hover:bg-blue-800 py-2 rounded"
          >
            Create Election
          </button>
        </div>
      </div>

      {/* Manage Created Elections */}
      <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md max-w-6xl mx-auto space-y-4">
        <h3 className="text-2xl font-bold text-blue-800 text-center mb-2">Created Elections</h3>
        {elections.length === 0 ? (
          <p className="text-center text-gray-600">No elections created yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {elections.map((e) => (
              <li
                key={e._id || e.id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center py-3 px-4 hover:bg-gray-50 rounded transition"
              >
                <div>
                  <p className="font-semibold text-blue-900">{e.title}</p>
                  <p className="text-sm text-gray-600">
                    Start: {new Date(e.startDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    End: {new Date(e.endDate).toLocaleDateString()}
                  </p>
                </div>

                {editingId === e._id ? (
                  <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-0">
                    <input
                      type="date"
                      value={editedDates.startDate}
                      onChange={handleEditedStartDateChange}
                      min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                      className="border p-1 rounded text-sm"
                      onFocus={(e) => e.target.showPicker?.()}
                    />
                    <input
                      type="date"
                      value={calculateEndDate(editedDates.startDate)}
                      className="border p-1 rounded text-sm bg-gray-100"
                      disabled
                    />
                    <button
                      onClick={() => handleUpdateElection(e._id)}
                      className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3 md:mt-0">
                    <button
                      onClick={() => {
                        setEditingId(e._id);
                        setEditedDates({  
                          startDate: e.startDate.split('T')[0],
                          endDate: e.endDate.split('T')[0],
                        });
                      }}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => handleDeleteElection(e._id)}
                      className="bg-[#ff5154] hover:bg-[#fc161a] text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardSection;