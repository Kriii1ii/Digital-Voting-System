import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { io as ioClient } from 'socket.io-client';

// Determine socket server URL in dev: prefer env VITE_BACKEND_URL, fallback to localhost:5001
const SOCKET_SERVER = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
  ? import.meta.env.VITE_BACKEND_URL
  : (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001');

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale);

// color palette (use palette from attachment lightly)
const COLORS = ['#08324D', '#D3342A', '#FA8C13', '#F6C24B', '#EDE1C1'];

export default function AnimatedPoll({ electionId = 'mock-election', historyLimit = 60 }) {
  const socketRef = useRef(null);
  const [candidates, setCandidates] = useState([]); // [{id,name,color}]
  const [history, setHistory] = useState([]); // [{ts, votes: {id: votes}}]
  const [spikes, setSpikes] = useState({}); // {candidateId: true}

  useEffect(() => {
    let mounted = true;
    if (!electionId) return;

    socketRef.current = ioClient(SOCKET_SERVER, { transports: ['websocket'] });
    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinElection', electionId);
    });

    socketRef.current.on('prediction:update', (payload) => {
      if (!mounted) return;
      const data = payload?.data || payload;
      if (!data || !data.predictions) return;

      const ts = Date.now();
      const point = { ts, votes: {} };

      data.predictions.forEach((p, idx) => {
        point.votes[p.candidate_id] = p.votes || 0;
      });

      setHistory((prev) => {
        const next = [...prev, point].slice(-historyLimit);
        return next;
      });

      // ensure candidate metadata
      setCandidates((prev) => {
        if (prev.length === 0) {
          return data.predictions.map((p, i) => ({ id: p.candidate_id, name: p.name, color: COLORS[i % COLORS.length] }));
        }
        // add any new candidate
        const ids = prev.map(c => c.id);
        const added = data.predictions.filter(p => !ids.includes(p.candidate_id)).map((p, i) => ({ id: p.candidate_id, name: p.name, color: COLORS[(ids.length + i) % COLORS.length] }));
        return added.length ? [...prev, ...added] : prev;
      });

      // simple spike detection: delta > threshold
      setSpikes((prev) => {
        const newSpikes = { ...prev };
        data.predictions.forEach((p) => {
          const prevPoint = history.length ? history[history.length - 1] : null;
          const prevVotes = prevPoint ? (prevPoint.votes[p.candidate_id] || 0) : 0;
          const delta = (p.votes || 0) - prevVotes;
          if (delta >= 50) {
            newSpikes[p.candidate_id] = { at: Date.now(), size: delta };
            // remove spike after 6s
            setTimeout(() => setSpikes(s => { const c = { ...s }; delete c[p.candidate_id]; return c; }), 6000);
          }
        });
        return newSpikes;
      });
    });

    return () => {
      mounted = false;
      try { socketRef.current?.disconnect(); } catch (e) {}
    };
  }, [electionId]);

  // build chart data
  const labels = history.map(h => h.ts);
  const datasets = candidates.map((c, idx) => ({
    label: c.name,
    data: history.map(h => h.votes[c.id] ?? null),
    borderColor: c.color,
    backgroundColor: c.color + '33',
    fill: true,
    tension: 0.3,
    pointRadius: 0,
    borderWidth: 2,
    order: 1,
  }));

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { type: 'time', time: { unit: 'second', tooltipFormat: 'HH:mm:ss' }, grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
    },
    animation: { duration: 600, easing: 'easeOutCubic' },
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Live Vote Trends</h3>
        <div className="text-sm text-gray-500">Real-time • {history.length} pts</div>
      </div>

      <div style={{ height: 220 }}>
        <Line data={data} options={options} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {candidates.map((c) => {
          const latest = history.length ? (history[history.length - 1].votes[c.id] ?? 0) : 0;
          const prev = history.length > 1 ? (history[history.length - 2].votes[c.id] ?? 0) : 0;
          const delta = latest - prev;
          const isSpike = spikes[c.id];
          return (
            <div key={c.id} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{c.name}</div>
                  {isSpike && (
                    <div className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Spike +{isSpike.size}</div>
                  )}
                  <div className="ml-auto text-sm text-gray-600">{latest} ({delta >= 0 ? `+${delta}` : delta})</div>
                </div>
                {/* sparkline using small inline svg fallback */}
                <div className="mt-1"><Sparkline data={history.map(h => h.votes[c.id] ?? 0)} color={c.color} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sparkline({ data = [], color = '#888' }) {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = 100 - ((v ?? 0) / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-full h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
