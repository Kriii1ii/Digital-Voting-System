import React, { useEffect, useState, useRef } from 'react';
import { io as ioClient } from 'socket.io-client';
import { getPrediction } from '../api/endpoints';

export default function LivePoll({ electionId, refreshInterval = 5000, title }) {
  const [predictions, setPredictions] = useState([]);
  const [usedFallback, setUsedFallback] = useState(true);
  const [modelMeta, setModelMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!electionId) return;

    let mounted = true;

    const setupSocket = () => {
      try {
        socketRef.current = ioClient(window.location.origin, { transports: ['websocket'] });
        socketRef.current.on('connect', () => {
          socketRef.current.emit('joinElection', electionId);
        });
        socketRef.current.on('prediction:update', (data) => {
          if (!mounted) return;
          // support both room-only payload (data) and global { electionId, data }
          const payload = data?.data ? data.data : data;
          if (payload && payload.predictions) {
            setPredictions(payload.predictions);
            setUsedFallback(!!payload.usedFallback);
            setModelMeta(payload.model_meta || null);
            setLoading(false);
          }
        });
      } catch (e) {
        console.warn('Socket init failed', e.message || e);
      }
    };

    const fetchOnce = async () => {
      try {
        const res = await getPrediction(electionId);
        if (!mounted) return;
        const preds = res.predictions || res.candidates || [];
        setPredictions(preds);
        setUsedFallback(!!res.usedFallback);
        setModelMeta(res.model_meta || null);
      } catch (err) {
        console.error('LivePoll fetch failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    setupSocket();
    fetchOnce();
    const timer = setInterval(fetchOnce, refreshInterval);

    return () => {
      mounted = false;
      clearInterval(timer);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [electionId, refreshInterval]);

  const sorted = [...(predictions || [])].sort((a, b) => (b.predicted_pct || 0) - (a.predicted_pct || 0));

  // friendly count fallback: use votes/count/raw_score if present, otherwise synthesize a value from pct
  const totalEstimated = sorted.reduce((acc, p) => acc + (p.votes || p.count || p.raw_score || 0), 0) || 0;

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* header image */}
        <div className="h-36 bg-gradient-to-r from-pink-200 via-orange-100 to-yellow-50 flex items-center justify-center">
          {/* Optionally allow a custom title / image later */}
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {title || 'The best option according to your votes is...'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">Live poll — updates automatically as people engage</p>

          {loading && <div className="text-center text-gray-400">Loading predictions…</div>}

          {!loading && sorted.length === 0 && (
            <div className="text-center text-gray-500">No candidates found for this election.</div>
          )}

          <div className="space-y-3">
            {sorted.map((p, idx) => {
              const pct = Math.max(0, Math.min(100, p.predicted_pct || 0));
              const count = p.votes || p.count || p.raw_score || (totalEstimated ? Math.round((pct / 100) * totalEstimated) : Math.round(pct));
              return (
                <div key={p.candidate_id || p.id || idx} className="bg-pink-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(90deg,#fb7185,#f59e0b)` }} />
                      <div className="text-sm font-medium text-gray-800">{p.name}</div>
                    </div>
                    <div className="text-sm text-gray-700 flex items-baseline gap-2">
                      <span className="font-semibold">{count}</span>
                      <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg,#fb7185,#f59e0b)',
                        transition: 'width 900ms ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-center">
            <button className="px-6 py-2 bg-orange-400 text-white rounded-full shadow hover:bg-orange-500">Check for deals</button>
          </div>

          <div className="mt-3 text-xs text-gray-400 text-center">{usedFallback ? 'Heuristic fallback in use' : 'Model predictions active'}</div>
        </div>
      </div>
    </div>
  );
}

