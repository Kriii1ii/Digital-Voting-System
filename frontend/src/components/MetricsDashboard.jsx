import React, { useEffect, useState, useRef } from 'react';
import { io as ioClient } from 'socket.io-client';

const SOCKET_SERVER = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
  ? import.meta.env.VITE_BACKEND_URL
  : (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001');

function ProgressBar({ value = 0, color = '#3b82f6' }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <div className="w-full bg-gray-100 rounded h-3 overflow-hidden">
      <div style={{ width: `${pct}%`, background: color }} className="h-full transition-all" />
    </div>
  );
}

export default function MetricsDashboard({ electionId = 'mock-election' }) {
  const socketRef = useRef(null);
  const [metrics, setMetrics] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    socketRef.current = ioClient(SOCKET_SERVER, { transports: ['websocket'] });
    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinElection', electionId);
      // request immediate metrics
      socketRef.current.emit('mock:getMetrics');
    });

    socketRef.current.on('mock:metrics', (payload) => {
      const data = payload?.data || payload;
      setMetrics(data);
      setLastUpdate(new Date().toLocaleString());
      // collect candidate list
      if (data && data.perCandidate) setCandidates(Object.keys(data.perCandidate));
    });

    socketRef.current.on('prediction:update', (payload) => {
      const p = payload?.data?.predictions || payload?.predictions || [];
      if (p && p.length) setCandidates(p.map(x => x.candidate_id));
    });

    return () => {
      try { socketRef.current.disconnect(); } catch (e) {}
    };
  }, [electionId]);

  const requestMetrics = () => {
    socketRef.current.emit('mock:getMetrics');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Performance Metrics</h3>
        <div className="flex items-center gap-2">
          <button onClick={requestMetrics} className="px-3 py-1 bg-blue-600 text-white rounded">Request Now</button>
          <div className="text-xs text-gray-500">Last: {lastUpdate || '—'}</div>
        </div>
      </div>

      {!metrics && (
        <div className="text-sm text-gray-500">No metrics yet. Waiting for backend computation.</div>
      )}

      {metrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">Winner Accuracy</div>
              <div className="text-lg font-bold">{(metrics.overall?.winnerAccuracy * 100 || 0).toFixed(2)}%</div>
              <ProgressBar value={(metrics.overall?.winnerAccuracy || 0)} color="#f59e0b" />
              <div className="text-xs text-gray-500 mt-1">% of time predicted top candidate matched actual top candidate.</div>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">MAE (avg % error)</div>
              <div className="text-lg font-bold">{(metrics.overall?.aggregated?.regression?.MAE ?? 0).toFixed(2)}</div>
              <ProgressBar value={Math.min(1, (metrics.overall?.aggregated?.regression?.MAE ?? 0) / 25)} color="#10b981" />
              <div className="text-xs text-gray-500 mt-1">Average absolute percent error across candidates.</div>
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-600">RMSE (percent)</div>
              <div className="text-lg font-bold">{(metrics.overall?.aggregated?.regression?.RMSE ?? 0).toFixed(2)}</div>
              <ProgressBar value={Math.min(1, (metrics.overall?.aggregated?.regression?.RMSE ?? 0) / 25)} color="#ef4444" />
              <div className="text-xs text-gray-500 mt-1">Root mean square percent error (penalizes large errors).</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Per-candidate breakdown</div>
            <div className="space-y-2">
              {candidates.map((id) => {
                const c = metrics.perCandidate?.[id];
                const name = id;
                const prec = c?.classification?.precision ?? 0;
                const rec = c?.classification?.recall ?? 0;
                const f1 = c?.classification?.f1 ?? 0;
                const mae = c?.regression?.MAE ?? 0;
                const rmse = c?.regression?.RMSE ?? 0;
                const brier = c?.brier ?? 0;
                return (
                  <div key={id} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-gray-500">MAE {mae.toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Precision</div>
                        <div className="text-sm font-semibold">{(prec*100).toFixed(1)}%</div>
                        <ProgressBar value={prec} color="#3b82f6" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Recall</div>
                        <div className="text-sm font-semibold">{(rec*100).toFixed(1)}%</div>
                        <ProgressBar value={rec} color="#6366f1" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">F1</div>
                        <div className="text-sm font-semibold">{(f1*100).toFixed(1)}%</div>
                        <ProgressBar value={f1} color="#8b5cf6" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Brier</div>
                        <div className="text-sm font-semibold">{brier.toFixed(3)}</div>
                        <ProgressBar value={Math.min(1, 1 - brier)} color="#06b6d4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
