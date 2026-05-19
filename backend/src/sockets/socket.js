const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function userRoom(userId) {
  return `user:${String(userId)}`;
}

const TRIPS_LIST_ROOM = 'trips_list';

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

    // Used by trip-list views (search results, driver dashboard, admin trips page)
    // so they can receive aggregate seat-count updates without subscribing to
    // every trip individually.
    socket.on('join_trips_list', () => {
      socket.join(TRIPS_LIST_ROOM);
    });

    socket.on('leave_trips_list', () => {
      socket.leave(TRIPS_LIST_ROOM);
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

/**
 * Recompute the live booked/held/available counts for a trip and broadcast
 * a `trip_seat_count` event to:
 *   - the per-trip room (`trip:<id>`) for detail views, and
 *   - the shared `trips_list` room for list/dashboard views.
 *
 * Imported lazily to avoid a circular require with the models.
 */
async function emitTripSeatCount(tripId) {
  if (!io || !tripId) return;
  try {
    const Trip = require('../models/Trip');
    const Ticket = require('../models/Ticket');
    const SeatHold = require('../models/SeatHold');

    const trip = await Trip.findById(tripId).select('totalSeats seatIds');
    if (!trip) return;

    const now = new Date();
    const [bookedSeats, heldSeats] = await Promise.all([
      Ticket.countDocuments({
        tripId: trip._id,
        status: { $in: ['pending', 'paid'] },
      }),
      SeatHold.countDocuments({
        tripId: trip._id,
        expiresAt: { $gt: now },
      }),
    ]);

    const totalSeats = trip.totalSeats || trip.seatIds?.length || 0;
    const availableSeats = Math.max(0, totalSeats - bookedSeats - heldSeats);

    const payload = {
      tripId: String(trip._id),
      totalSeats,
      bookedSeats,
      heldSeats,
      availableSeats,
      at: now.toISOString(),
    };

    io.to(`trip:${tripId}`).emit('trip_seat_count', payload);
    io.to(TRIPS_LIST_ROOM).emit('trip_seat_count', payload);
  } catch (err) {
    console.error('[emitTripSeatCount] error:', err);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitSeatUpdate,
  emitSeatHold,
  emitSeatRelease,
  emitNotification,
  emitTripSeatCount,
  userRoom,
};
