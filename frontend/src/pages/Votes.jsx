import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { getVotes } from "../api/endpoints"; // <-- import API function

const Votes = () => {
  const { t } = useLanguage();
  const [votes, setVotes] = useState([]); // Holds votes from backend
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const data = await getVotes(); // <-- call API from endpoints.js
        setVotes(data);
      } catch (error) {
        console.error("Error fetching votes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVotes();
  }, []);

  const handleReset = () => setSearchTerm("");

  const filteredVotes = votes.filter(
    (v) =>
      v.voterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.candidateName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-700">{t("votes")}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition"
            >
              <RotateCcw className="w-4 h-4" /> {t("reset")}
            </button>
            <input
              type="text"
              placeholder={t("search")}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2 text-left border-b">{t("voter")}'s {t("name")}</th>
                <th className="px-4 py-2 text-left border-b">{t("candidate")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="2" className="text-center py-4 text-gray-500 italic">
                    Loading...
                  </td>
                </tr>
              ) : filteredVotes.length > 0 ? (
                filteredVotes.map((vote, index) => (
                  <tr
                    key={index}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}
                  >
                    <td className="px-4 py-2 border-b">{vote.voterName}</td>
                    <td className="px-4 py-2 border-b">{vote.candidateName}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="text-center py-4 text-gray-500 italic">
                    No votes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Votes;
