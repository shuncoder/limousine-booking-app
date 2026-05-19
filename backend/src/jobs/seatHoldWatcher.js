const SeatHold = require('../models/SeatHold');
const { getIO, emitTripSeatCount } = require('../sockets/socket');

async function expireSeatHoldsOnce(limit = 500) {
  const now = new Date();
  const expired = await SeatHold.find({ expiresAt: { $lte: now } })
    .select('tripId seatId userId')
    .limit(limit);

  if (!expired.length) return;

  const ids = expired.map((hold) => hold._id);
  await SeatHold.deleteMany({ _id: { $in: ids } });

  const io = getIO();
  const affectedTripIds = new Set();

  for (const hold of expired) {
    if (io) {
      io.to(`trip:${hold.tripId}`).emit('seat_update', {
        tripId: String(hold.tripId),
        seatId: hold.seatId,
        status: 'available',
        reason: 'hold_expired',
      });
    }
    affectedTripIds.add(String(hold.tripId));
  }

  for (const tripId of affectedTripIds) {
    emitTripSeatCount(tripId).catch(() => undefined);
  }
}

function startSeatHoldWatcher({ intervalMs = 5000 } = {}) {
  setInterval(() => {
    expireSeatHoldsOnce().catch(() => undefined);
  }, intervalMs).unref();
}

module.exports = { startSeatHoldWatcher };
