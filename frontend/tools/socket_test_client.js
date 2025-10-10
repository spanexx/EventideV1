const { io } = require('socket.io-client');

const SERVER = process.env.SERVER || 'http://localhost:3000';
const ROOM = process.env.ROOM || 'user-68e646d5a710029721af34e9';

console.log(`Connecting to ${SERVER}, joining room ${ROOM}`);

const socket = io(SERVER, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('socket connected', socket.id);
  socket.emit('joinRoom', ROOM);
});

socket.on('joinedRoom', (room) => {
  console.log('joinedRoom ack:', room);
});

socket.on('disconnect', (reason) => {
  console.log('socket disconnected:', reason);
});

socket.on('bookingNotification', (payload) => {
  console.log('bookingNotification received:', JSON.stringify(payload, null, 2));
});

socket.on('paymentNotification', (payload) => {
  console.log('paymentNotification received:', JSON.stringify(payload, null, 2));
});

socket.on('notification', (payload) => {
  console.log('notification received:', JSON.stringify(payload, null, 2));
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message);
});
