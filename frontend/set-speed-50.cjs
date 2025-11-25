const { io } = require('socket.io-client');
const url = process.env.METRICS_URL || 'http://localhost:5001';
const socket = io(url, { transports: ['websocket'] });
console.log('Connecting to', url);
socket.on('connect', () => {
  console.log('Connected', socket.id);
  socket.emit('joinElection', 'mock-election');
  socket.emit('mock:setSpeed', { speed: 50 });
  console.log('Requested speed=50');
  setTimeout(() => process.exit(0), 500);
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message || err);
  process.exit(1);
});
