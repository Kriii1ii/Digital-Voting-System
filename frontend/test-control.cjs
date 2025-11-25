const { io } = require('socket.io-client');
const url = 'http://localhost:5001';
const socket = io(url, { transports: ['websocket'] });
console.log('Connecting to', url);
socket.on('connect', () => {
  console.log('Connected', socket.id);
  socket.emit('joinElection', 'mock-election');
  // request status
  socket.emit('mock:getStatus');
  setTimeout(() => {
    console.log('Sending stop');
    socket.emit('mock:stop');
  }, 2000);
  setTimeout(() => {
    console.log('Sending start');
    socket.emit('mock:start');
  }, 5000);
  setTimeout(() => {
    console.log('Setting speed 5x');
    socket.emit('mock:setSpeed', { speed: 5 });
  }, 8000);
  setTimeout(() => {
    console.log('Sending spike to prapti');
    socket.emit('mock:spike', { candidateId: 'prapti', amount: 50 });
  }, 11000);
  setTimeout(() => { console.log('Done'); process.exit(0); }, 14000);
});

socket.on('mock:status', (s) => console.log('mock:status', s));
socket.on('mock:spike:ack', (a) => console.log('spike ack', a));
socket.on('prediction:update', (m) => { console.log('prediction:update (short) ', JSON.stringify(m).slice(0,300)); });
