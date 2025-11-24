import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { api } from '../api/axiosInstance';
import { io as ioClient } from 'socket.io-client';

export default function PredictionPoll({ electionId, refreshInterval = 10000 }) {
  const [data, setData] = useState({ candidates: [], topCandidateId: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------------------------
  // FIXED: Prediction Fetcher
  // ---------------------------
  async function fetchPredictions() {
    try {
      setError(null);

      // 🔥 Required: DO NOT FETCH without electionId
      if (!electionId) {
        setLoading(false);
        return;
      }

      const resp = await api.get(`/predictions/election/${electionId}`);

      if (resp?.data) {
        setData(resp.data);
      } else {
        setData({ candidates: [], topCandidateId: null });
      }
    } catch (err) {
      console.error("Prediction fetch error:", err);
      setError(err.response?.data || err.message || "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  }

  const socketRef = useRef(null);

  // ---------------------------
  // FIXED: Proper useEffect
  // ---------------------------
  useEffect(() => {
    let mounted = true;

    // Load immediately FIRST
    fetchPredictions();

    // Skip socket if no electionId
    if (!electionId) return;

    try {
      socketRef.current = ioClient(window.location.origin, {
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('joinElection', electionId);
      });

      socketRef.current.on('prediction:update', (payload) => {
        if (!mounted) return;

        const p = payload?.data || payload;
        if (!p) return;

        // Normalize candidates data
        const mapped = (p.candidates || p.predictions || []).map((it) => ({
          id: it.candidate_id || it.id || it._id,
          name: it.name || it.fullName,
          party: it.party || "",
          percentage: Number(it.percentage ?? it.predicted_pct ?? 0),
        }));

        const topId = p.topCandidateId || (mapped[0]?.id ?? null);

        setData({
          candidates: mapped,
          topCandidateId: topId,
        });

        setLoading(false);
      });

      socketRef.current.on('connect_error', (err) => {
        console.warn('Prediction socket error:', err?.message);
      });
    } catch (e) {
      console.warn('Socket init failed:', e.message);
    }

    return () => {
      mounted = false;
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (e) {}
      }
    };
  }, [electionId]);

  const candidates = data.candidates || [];

  // ---------------------------
  // Render UI
  // ---------------------------
  if (loading) return <div className="p-4 bg-white rounded shadow">Loading predictions…</div>;

  if (error)
    return (
      <div className="p-4 bg-red-50 rounded border text-red-700">
        {String(error.message || error)}
      </div>
    );

  if (!candidates.length)
    return <div className="p-4 bg-white rounded shadow">No predictions available</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">AI Election Prediction</h3>

      <div className="space-y-3">
        {candidates.map((c) => {
          const pct = Math.min(100, Math.max(0, Number(c.percentage || 0)));
          const isTop = String(c.id) === String(data.topCandidateId);

          return (
            <div
              key={c.id}
              className={`p-3 rounded-lg ${
                isTop ? 'ring-2 ring-yellow-300 bg-yellow-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {c.name}{' '}
                  <span className="text-xs text-gray-500">{c.party}</span>
                </div>
                <div className="font-semibold">{pct.toFixed(1)}%</div>
              </div>
              <div className="w-full bg-white rounded-full h-3 mt-2 overflow-hidden">
                <div
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg,#06b6d4,#f97316)',
                    height: '100%',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

PredictionPoll.propTypes = {
  electionId: PropTypes.string,
  refreshInterval: PropTypes.number,
};
