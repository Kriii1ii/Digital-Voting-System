const { io } = require('socket.io-client');
const url = process.env.METRICS_URL || 'http://localhost:5001';
const socket = io(url, { transports: ['websocket'] });
console.log('Connecting to', url);
let got = false;
socket.on('connect', () => {
  console.log('Connected', socket.id);
  socket.emit('joinElection', 'mock-election');
  // speed up simulation temporarily
  socket.emit('mock:setSpeed', { speed: 10 });
  setTimeout(() => {
    console.log('Requesting metrics now');
    socket.emit('mock:getMetrics');
  }, 3000);
});

socket.on('mock:metrics', (msg) => {
  console.log('Received mock:metrics:');
  console.log(JSON.stringify(msg, null, 2));
  got = true;
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message || err);
  process.exit(1);
});

setTimeout(() => { if(!got) { console.error('Timed out waiting for metrics'); process.exit(2); } }, 15000);
