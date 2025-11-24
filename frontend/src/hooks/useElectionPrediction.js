import { useCallback, useEffect, useState } from "react";
import { getElectionPredictionSummary } from "../api/endpoints";
import { useAuth } from "../contexts/AuthContext";

export const useElectionPrediction = ({ electionId, refreshInterval = 15000 } = {}) => {
  const { user } = useAuth();
  const [data, setData] = useState({ candidates: [], topCandidateId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const canView = user && (user.role === "voter" || user.role === "admin");

  const fetchPrediction = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      setError(null);
      return;
    }

    try {
      if (!data.candidates.length) {
        setLoading(true);
      }
      const response = await getElectionPredictionSummary(electionId);
      setData(response);
      setError(null);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load prediction data.");
    } finally {
      setLoading(false);
    }
  }, [canView, electionId, data.candidates.length]);

  useEffect(() => {
    fetchPrediction();
    if (!canView) return undefined;

    const timer = setInterval(fetchPrediction, refreshInterval);
    return () => clearInterval(timer);
  }, [fetchPrediction, refreshInterval, canView]);

  return {
    ...data,
    loading,
    error,
    lastUpdated,
    canView,
    refresh: fetchPrediction,
  };
};

export default useElectionPrediction;





