import React, { useEffect, useState, useRef } from 'react';
import { io as ioClient } from 'socket.io-client';

const SOCKET_SERVER = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
  ? import.meta.env.VITE_BACKEND_URL
  : (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001');

export default function AdminControls({ electionId = 'mock-election' }) {
  const socketRef = useRef(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [candidates, setCandidates] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    socketRef.current = ioClient(SOCKET_SERVER, { transports: ['websocket'] });
    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinElection', electionId);
      socketRef.current.emit('mock:getStatus');
      setStatusMsg('Connected to control socket');
    });

    socketRef.current.on('prediction:update', (payload) => {
      const data = payload?.data || payload;
      if (!data || !data.predictions) return;
      setCandidates(data.predictions.map(p => ({ id: p.candidate_id, name: p.name })));
    });

    socketRef.current.on('mock:status', (s) => {
      setRunning(Boolean(s.running));
      setSpeed(Number(s.speed) || 1);
      setStatusMsg(`Running: ${s.running} • Speed: ${s.speed}x`);
    });

    socketRef.current.on('mock:spike:ack', (ack) => {
      setStatusMsg(`Spike applied to ${ack.candidateId}: +${ack.amount}`);
    });

    return () => {
      try { socketRef.current.disconnect(); } catch (e) {}
    };
  }, [electionId]);

  const sendStart = () => { socketRef.current.emit('mock:start'); };
  const sendStop = () => { socketRef.current.emit('mock:stop'); };
  const changeSpeed = (s) => { socketRef.current.emit('mock:setSpeed', { speed: s }); };
  const spikeCandidate = (id) => { socketRef.current.emit('mock:spike', { candidateId: id, amount: 50 }); };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Admin Simulation Controls</h3>

      <div className="flex gap-2 mb-3">
        <button onClick={sendStart} className="px-3 py-2 bg-green-500 text-white rounded">Start</button>
        <button onClick={sendStop} className="px-3 py-2 bg-red-500 text-white rounded">Stop</button>
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Speed</label>
        <div className="flex gap-2">
          {[0.5,1,2,5].map(s => (
            <button key={s} onClick={() => changeSpeed(s)} className={`px-3 py-1 rounded ${s===speed? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">Manual Spikes</label>
        <div className="space-y-2">
          {candidates.length===0 && <div className="text-xs text-gray-500">Waiting for candidate data...</div>}
          {candidates.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <div className="flex-1">{c.name}</div>
              <button onClick={() => spikeCandidate(c.id)} className="px-2 py-1 bg-purple-500 text-white rounded">Viral +50</button>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-500">{statusMsg}</div>
    </div>
  );
}
