const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_trip', ({ tripId }) => {
      if (!tripId) return;
      socket.join(`trip:${tripId}`);
    });

    socket.on('leave_trip', ({ tripId }) => {
      if (!tripId) return;
      socket.leave(`trip:${tripId}`);
    });

    socket.on('ride_request', (data) => {
      io.emit('ride_request', data);
    });
    socket.on('ride_accept', (data) => {
      io.emit('ride_accept', data);
    });
    socket.on('driver_location', (data) => {
      io.emit('driver_location', data);
    });
    socket.on('ride_complete', (data) => {
      io.emit('ride_complete', data);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
