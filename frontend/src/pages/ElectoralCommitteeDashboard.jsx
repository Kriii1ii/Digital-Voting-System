import React, { useState, useEffect } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { 
  addVoter, 
  getCandidates, 
  getElections, 
  createElection, 
  getVoters 
} from "../api/endpoints";

const ElectoralCommitteeDashboard = () => {
  const { token, user, logout } = useAuth();
  const { t } = useLanguage();

  const [activeSection, setActiveSection] = useState("dashboard");
  const [elections, setElections] = useState([]);
  const [newElection, setNewElection] = useState({ name: "", startDate: "", endDate: "" });
  const [voters, setVoters] = useState([]);
  const [newVoter, setNewVoter] = useState({ id: "", name: "" });
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedDates, setEditedDates] = useState({ startDate: "", endDate: "" });

  // Fetch initial data
  useEffect(() => {
  const fetchData = async () => {
    if (!token) return;

    try {
      const electionsData = await getElections(token); // if your elections API requires token
      setElections(electionsData);

      const candidatesData = await getCandidates(token); // if candidates API requires token
      setCandidates(candidatesData);

      const votersData = await getVoters(token); // ✅ pass token here
      setVoters(votersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  fetchData();
}, [token]);

  // --- Handlers ---
  const handleChangeElection = (e) => setNewElection({ ...newElection, [e.target.name]: e.target.value });

  const handleCreateElection = async () => {
    if (!newElection.name || !newElection.startDate || !newElection.endDate) {
      alert("Please fill all fields");
      return;
    }

    // Check role
    if (!["admin", "committee"].includes(user?.role)) {
      alert("Only admins or committee members can create elections");
      return;
    }

    try {
      const created = await createElection(newElection, token);
      setElections([...elections, created]);
      setNewElection({ name: "", startDate: "", endDate: "" });
      alert("Election created successfully!");
    } catch (error) {
      console.error("Error creating election:", error);
      alert(error.response?.data?.message || error.message);
    }
  };

  const handleAddVoter = async () => {
    if (!newVoter.id || !newVoter.name) {
      alert("Enter both Voter ID and Name");
      return;
    }

    if (voters.some(v => v.id === newVoter.id)) {
      alert("Voter ID already exists!");
      return;
    }

    try {
      const added = await addVoter(newVoter, token);
      setVoters([...voters, added]);
      setNewVoter({ id: "", name: "" });
    } catch (error) {
      console.error("Failed to add voter:", error);
      alert("Failed to add voter");
    }
  };

  const handleLogout = () => logout();

  const handleBack = () => setSelectedCandidate(null);

   const handleChange = (e) => setNewElection({ ...newElection, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gray-100 shadow-sm flex justify-center items-center px-6 py-4 fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="h-18 w-auto object-contain" />
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-900 to-blue-500 text-transparent bg-clip-text tracking-wide">
            Electoral Committee Dashboard
          </h1>
        </div>
      </header>

      <div className="flex flex-1 mt-20">
        {/* Sidebar */}
        <aside className="w-64 bg-blue-50 shadow-md flex flex-col">
          <nav className="flex-1 px-4 py-6 text-lg font-semibold space-y-2">
            {["dashboard", "voters", "candidates", "elections"].map((section) => (
              <button
                key={section}
                onClick={() => { setActiveSection(section); setSelectedCandidate(null); }}
                className={`w-full text-left px-4 py-2 rounded-md transition ${
                  activeSection === section ? "bg-gray-300 text-blue-900 font-semibold" : "hover:bg-blue-200 text-blue-950"
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
            <div className="p-4 mt-99">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-12 py-2 bg-blue-800 text-white hover:bg-blue-900 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-semibold">{t ? t("logout") : "Logout"}</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-blue-900 mb-4 text-left">Dashboard</h2>
              
              {/* Create Election Form */}
              <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md max-w-md mx-auto space-y-5" style={{ minHeight: "340px" }}>
                <h3 className="text-2xl font-bold text-blue-800 mb-4 text-center">Create New Election</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter Election Location"
                    value={newElection.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    name="startDate"
                    value={newElection.startDate}
                    onChange={handleChange}
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    name="endDate"
                    value={newElection.endDate}
                    onChange={handleChange}
                    min={newElection.startDate || new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCreateElection}
                    className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-900"
                  >
                    Create Election
                  </button>
                </div>
              </div>

              {/* Manage Created Elections */}
              <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md max-w-6xl mx-auto space-y-4">
                <h3 className="text-xl font-bold text-blue-800 text-center mb-2">Created Elections</h3>
                {elections.length === 0 ? (
                  <p className="text-center text-gray-600">No elections created yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {elections.map((e) => (
                      <li key={e.id} className="flex flex-col md:flex-row justify-between items-start md:items-center py-3 px-4 hover:bg-gray-50 rounded transition">
                        <div>
                          <p className="font-semibold text-blue-900">{e.name}</p>
                          <p className="text-sm text-gray-600">Start: {e.startDate}</p>
                          <p className="text-sm text-gray-600">End: {e.endDate}</p>
                        </div>
                        {editingId === e.id ? (
                          <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-0">
                            <input
                              type="date"
                              value={editedDates.startDate}
                              onChange={(ev) => setEditedDates({ ...editedDates, startDate: ev.target.value })}
                              className="border p-1 rounded text-sm"
                            />
                            <input
                              type="date"
                              value={editedDates.endDate}
                              onChange={(ev) => setEditedDates({ ...editedDates, endDate: ev.target.value })}
                              className="border p-1 rounded text-sm"
                            />
                            <button
                              onClick={() => {
                                setElections(
                                  elections.map((el) =>
                                    el.id === e.id ? { ...el, startDate: editedDates.startDate, endDate: editedDates.endDate } : el
                                  )
                                );
                                setEditingId(null);
                              }}
                              className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
                            >
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-3 md:mt-0">
                            <button
                              onClick={() => {
                                setEditingId(e.id);
                                setEditedDates({ startDate: e.startDate, endDate: e.endDate });
                              }}
                              className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => setElections(elections.filter((el) => el.id !== e.id))}
                              className="bg-red-700 text-white px-3 py-1 rounded hover:bg-red-700"
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
          )}

          {/* Voters Section */}
          {activeSection === "voters" && (
            <div>
              <div className="bg-white p-6 rounded-lg shadow-md max-w-sm ml-10 mb-8 mt-3" style={{ minHeight: "250px" }}>
                <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Add New Voter</h3>
                <input
                  type="text"
                  placeholder="Voter ID"
                  value={newVoter.id}
                  onChange={(e) => setNewVoter({ ...newVoter, id: e.target.value })}
                  className="w-full border p-2 rounded mb-3"
                />
                <input
                  type="text"
                  placeholder="Voter Name"
                  value={newVoter.name}
                  onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                  className="w-full border p-2 rounded mb-3"
                />
                <button
                  onClick={handleAddVoter}
                  className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-900 transition"
                >
                  Add Voter
                </button>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Registered Voters</h3>
                {voters.length === 0 ? (
                  <p>No voters registered yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {voters.map((v) => (
                      <li key={v.id} className="py-2 flex justify-between">
                        {v.name} <span>ID: {v.id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Candidates Section */}
          {activeSection === "candidates" && (
            <div>
              {!selectedCandidate ? (
                <>
                  <h2 className="text-2xl font-semibold mb-4">Candidates</h2>
                  <ul className="bg-white p-4 rounded shadow space-y-4">
                    {candidates.map((c) => (
                      <li
                        key={c.id}
                        className="border p-4 rounded cursor-pointer hover:bg-blue-50 flex items-center gap-4"
                        onClick={() => setSelectedCandidate(c)}
                      >
                        <img src={c.profilePic || "/default-profile.png"} alt={c.name} className="w-16 h-16 rounded-full object-cover border" />
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{c.name}</p>
                          <p className="text-gray-600">{c.email}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handleBack}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>{t ? t("back") : "Back"}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-6">
                    <img src={selectedCandidate.profilePic || "/default-profile.png"} alt={selectedCandidate.name} className="w-24 h-24 rounded-full object-cover border" />
                    <div>
                      <h3 className="text-2xl font-semibold">{selectedCandidate.name}</h3>
                      <p className="text-gray-600">{selectedCandidate.email}</p>
                      <p className="mt-2">{selectedCandidate.bio}</p>
                      {selectedCandidate.signImg && (
                        <div className="flex items-center gap-2 mt-2">
                          <img src={selectedCandidate.signImg} alt="Sign" className="w-16 h-16 object-contain" />
                          <span className="font-medium text-gray-800">{selectedCandidate.signName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Elections Section */}
          {activeSection === "elections" && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Elections</h2>
              {elections.length === 0 ? (
                <p>No elections yet.</p>
              ) : (
                <ul className="bg-white p-4 rounded shadow space-y-2">
                  {elections.map((e) => (
                    <li key={e.id} className="border p-3 rounded flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50">
                      <div>
                        <p className="font-semibold text-blue-900">{e.name}</p>
                        <p className="text-sm text-gray-600">Start: {e.startDate}</p>
                        <p className="text-sm text-gray-600">End: {e.endDate}</p>
                      </div>
                      {editingId === e.id ? (
                        <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                          <input
                            type="date"
                            value={editedDates.startDate}
                            onChange={(ev) => setEditedDates({ ...editedDates, startDate: ev.target.value })}
                            className="border p-1 rounded text-sm"
                          />
                          <input
                            type="date"
                            value={editedDates.endDate}
                            onChange={(ev) => setEditedDates({ ...editedDates, endDate: ev.target.value })}
                            className="border p-1 rounded text-sm"
                          />
                          <button
                            onClick={() => {
                              setElections(
                                elections.map((el) =>
                                  el.id === e.id ? { ...el, startDate: editedDates.startDate, endDate: editedDates.endDate } : el
                                )
                              );
                              setEditingId(null);
                            }}
                            className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <button
                            onClick={() => {
                              setEditingId(e.id);
                              setEditedDates({ startDate: e.startDate, endDate: e.endDate });
                            }}
                            className="bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => setElections(elections.filter((el) => el.id !== e.id))}
                            className="bg-red-700 text-white px-3 py-1 rounded hover:bg-red-700"
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
          )}
        </main>
      </div>
    </div>
  );
};

export default ElectoralCommitteeDashboard;
