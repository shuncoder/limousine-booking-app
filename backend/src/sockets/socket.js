const { Server } = require('socket.io');

function initSocket(server) {
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

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
}

module.exports = initSocket;
