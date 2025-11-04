import React, { useState, useEffect } from "react";
import AddVoterModal from "./AddVoterModal";
import EditVoterModal from "./EditVoterModal";
import { useLanguage } from "../contexts/LanguageContext";
import { getVoters, deleteVoter, updateVoter } from "../api/endpoints"; // Import your API functions

const VotersList = () => {
  const { t } = useLanguage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);

  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch voters from backend
  useEffect(() => {
    const fetchVoters = async () => {
      try {
        const data = await getVoters(); // API call
        setVoters(data);
      } catch (error) {
        console.error("Error fetching voters:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVoters();
  }, []);

  // Delete voter
  const handleDelete = async (id) => {
    try {
      await deleteVoter(id); // API call
      setVoters(voters.filter((v) => v.id !== id));
    } catch (error) {
      console.error("Error deleting voter:", error);
    }
  };

  // Update voter
  const handleUpdate = async (updatedVoter) => {
    try {
      await updateVoter(updatedVoter.id, updatedVoter); // API call
      setVoters(voters.map((v) => (v.id === updatedVoter.id ? updatedVoter : v)));
    } catch (error) {
      console.error("Error updating voter:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-700">{t("voters")} {t("list")}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          {t("addnew")}
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="p-3 border">{t("fullName")}</th>
            <th className="p-3 border">{t("email")}</th>
            <th className="p-3 border">{t("phone")}</th>
            <th className="p-3 border">{t("action")}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-500 italic">
                Loading...
              </td>
            </tr>
          ) : voters.length > 0 ? (
            voters.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="p-3 border">{v.fullname}</td>
                <td className="p-3 border">{v.email}</td>
                <td className="p-3 border">{v.phone}</td>
                <td className="p-3 border">
                  <button
                    onClick={() => {
                      setSelectedVoter(v);
                      setShowEditModal(true);
                    }}
                    className="bg-blue-800 text-white px-3 py-1 rounded mr-2"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="bg-red-700 text-white px-3 py-1 rounded"
                  >
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-4 text-gray-500 italic">
                No voters found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showAddModal && <AddVoterModal onClose={() => setShowAddModal(false)} />}
      {showEditModal && (
        <EditVoterModal
          voter={selectedVoter}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default VotersList;
