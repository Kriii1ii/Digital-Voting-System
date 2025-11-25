const { io } = require('socket.io-client');
const url = 'http://localhost:5001';
const socket = io(url, { transports: ['websocket'] });
console.log('Connecting to', url);
socket.on('connect', () => {
  console.log('Connected', socket.id);
  socket.emit('joinElection', 'mock-election');
});
socket.on('prediction:update', (msg) => {
  console.log('prediction:update', JSON.stringify(msg).slice(0, 500));
});
socket.on('disconnect', (r) => {
  console.log('disconnected', r);
});
setTimeout(() => { console.log('Done'); process.exit(0); }, 15000);
