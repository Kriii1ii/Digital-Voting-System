import React, { useEffect, useState, useRef } from 'react';
import { candidateNameMap } from '../utils/candidateNameMap';
import candidateColors from '../utils/candidateColors';
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
      const SOCKET_SERVER = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
        ? import.meta.env.VITE_BACKEND_URL
        : (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001');

      socketRef.current = ioClient(SOCKET_SERVER, {
        transports: ['websocket'],
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('joinElection', electionId);
      });

      socketRef.current.on('prediction:update', (payload) => {
        if (!mounted) return;

        // debug incoming payload to help trace placeholder names
        try { console.debug('[PredictionPoll] prediction:update', payload); } catch (e) {}

        const p = payload?.data || payload;
        if (!p) return;

        // Normalize candidates data
        const mapped = (p.candidates || p.predictions || []).map((it) => {
          const idVal = it.candidate_id || it.id || it._id;
          const rawName = it.name || it.fullName || '';
          const lookup = (String(idVal || '')).toLowerCase();
          const displayName = candidateNameMap[lookup] || rawName || candidateNameMap[rawName?.toLowerCase?.()] || rawName;
          return ({
            id: idVal,
            name: displayName,
            party: it.party || "",
            percentage: Number(it.percentage ?? it.predicted_pct ?? 0),
            recent_comments: it.recent_comments || it.recentComments || [],
          });
        });

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

  // Fallback: synthesize five canonical candidates if none are returned yet
  const fallbackVotes = { prapti: 1000, astha: 850, max: 700, lewis: 950, rabina: 600 };
  const fallbackOrder = ['prapti','astha','max','lewis','rabina'];
  const candidatesToShow = candidates.length ? candidates : fallbackOrder.map((id) => {
    const name = candidateNameMap[id] || id;
    const votes = fallbackVotes[id] || 0;
    const total = Object.values(fallbackVotes).reduce((a,b)=>a+b,0) || 1;
    const pct = Number(((votes/total)*100).toFixed(2));
    return { id, name, party: '', percentage: pct, recent_comments: [], votes };
  });

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
        {candidatesToShow.map((c) => {
          const pct = Math.min(100, Math.max(0, Number(c.percentage || 0)));
          const isTop = String(c.id) === String(data.topCandidateId);
          const color = candidateColors[(c.id || '').toString().toLowerCase()] || '#64748b';

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
                    background: `linear-gradient(90deg, ${color}, ${shadeColor(color, -25)})`,
                    height: '100%',
                  }}
                />
              </div>
              {/* recent comments / sentiment */}
              {c.recent_comments && c.recent_comments.length > 0 && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  {c.recent_comments.slice().reverse().map((cm, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cm.sentiment > 0 ? 'bg-green-400' : cm.sentiment < 0 ? 'bg-red-400' : 'bg-gray-300'}`} />
                      <div className="truncate">{cm.text}</div>
                      <div className="ml-auto text-gray-400">{cm.sentiment > 0 ? `+${(cm.sentiment*100).toFixed(0)}%` : `${(cm.sentiment*100).toFixed(0)}%`}</div>
                    </div>
                  ))}
                </div>
              )}
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

// small helper to darken/lighten a hex color (percent -100..100)
function shadeColor(hex, percent) {
  try {
    const h = hex.replace('#','');
    const num = parseInt(h,16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0x00FF) + percent;
    let b = (num & 0x0000FF) + percent;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  } catch (e) {
    return hex;
  }
}
