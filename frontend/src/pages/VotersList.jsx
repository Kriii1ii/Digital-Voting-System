import React, { useState } from "react";
import AddVoterModal from "./AddVoterModal";
import EditVoterModal from "./EditVoterModal";
import { useLanguage } from "../contexts/LanguageContext";

const VotersList = () => {
  const { t } = useLanguage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);

  const [voters, setVoters] = useState([
    { id: 1, fullname: "Anuska Shrestha", email: "anu@gmail.com", phone: "7414741470" },
    { id: 2, fullname: "Kritu Khanal", email: "kritu@gmail.com", phone: "8520001470" },
    { id: 3, fullname: "Anmol Shrestha", email: "anmol@gmail.com", phone: "7158960145" },
  ]);

  // Delete voter
  const handleDelete = (id) => {
    setVoters(voters.filter((v) => v.id !== id));
  };

  // Update voter
  const handleUpdate = (updatedVoter) => {
    setVoters(voters.map((v) => (v.id === updatedVoter.id ? updatedVoter : v)));
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
          {voters.map((v) => (
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
          ))}
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
