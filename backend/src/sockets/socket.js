const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function userRoom(userId) {
  return `user:${String(userId)}`;
}

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' },
  });
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));

      const secret = process.env.JWT_SECRET || 'dev-jwt-secret';
      const decoded = jwt.verify(token, secret);

      socket.user = decoded.user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    console.log('Socket connected:', socket.id, userId);

    if (userId) {
      socket.join(userRoom(userId));
    }

    socket.on('join_trip', ({ tripId }) => {
      if (!tripId) return;
      socket.join(`trip:${tripId}`);
    });

    socket.on('leave_trip', ({ tripId }) => {
      if (!tripId) return;
      socket.leave(`trip:${tripId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  return io || null;
}

function emitSeatUpdate(tripId, payload) {
  if (!io) return;
  io.to(`trip:${tripId}`).emit('seat_update', payload);
}

function emitSeatHold(tripId, payload) {
  if (!io) return;
  io.to(`trip:${tripId}`).emit('seat_hold', payload);
}

function emitSeatRelease(tripId, payload) {
  if (!io) return;
  io.to(`trip:${tripId}`).emit('seat_release', payload);
}

function emitNotification(userId, notification) {
  if (!io || !userId) return;
  io.to(userRoom(userId)).emit('notification:new', notification);
}

module.exports = {
  initSocket,
  getIO,
  emitSeatUpdate,
  emitSeatHold,
  emitSeatRelease,
  emitNotification,
  userRoom,
};
