// src/pages/CandidatesList.jsx
import React, { useState, useEffect } from "react";
import AddCandidateModal from "./AddCandidateModal";
import EditCandidateModal from "./EditCandidateModal";
import { useLanguage } from "../contexts/LanguageContext";
import {
  getCandidates,
  addCandidate,
  updateCandidate,
  deleteCandidate,
} from "../api/endpoints";

const CandidatesList = () => {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch candidates from API on mount
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const data = await getCandidates();
        setCandidates(data);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  // Delete candidate
  const handleDelete = async (id) => {
    try {
      await deleteCandidate(id);
      setCandidates(candidates.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting candidate:", error);
    }
  };

  // Add candidate
  const handleAdd = async (newCandidate) => {
    try {
      const added = await addCandidate(newCandidate);
      setCandidates([...candidates, added]);
    } catch (error) {
      console.error("Error adding candidate:", error);
    }
  };

  // Update candidate
  const handleUpdate = async (updatedCandidate) => {
    try {
      const updated = await updateCandidate(updatedCandidate.id, updatedCandidate);
      setCandidates(
        candidates.map((c) => (c.id === updated.id ? updated : c))
      );
    } catch (error) {
      console.error("Error updating candidate:", error);
    }
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-700">{t("candidates")}</h1>
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
            <th className="p-3 border">{t("bio")}</th>
            <th className="p-3 border">{t("photo")}</th>
            <th className="p-3 border">{t("action")}</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="p-3 border">{c.fullname}</td>
              <td className="p-3 border">{c.bio}</td>
              <td className="p-3 border text-center">
                <img
                  src={c.photo}
                  alt="candidate"
                  className="w-12 h-12 object-cover rounded-full border mx-auto"
                />
              </td>
              <td className="p-3 border text-center">
                <button
                  onClick={() => {
                    setSelectedCandidate(c);
                    setShowEditModal(true);
                  }}
                  className="bg-blue-800 text-white px-3 py-1 rounded mr-2"
                >
                  {t("edit")}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="bg-red-700 text-white px-3 py-1 rounded"
                >
                  {t("delete")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAddModal && (
        <AddCandidateModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {showEditModal && (
        <EditCandidateModal
          candidate={selectedCandidate}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default CandidatesList;
