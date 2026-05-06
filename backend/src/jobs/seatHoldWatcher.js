const SeatHold = require('../models/SeatHold');
const { getIO } = require('../sockets/socket');

async function expireSeatHoldsOnce(limit = 500) {
  const now = new Date();
  const expired = await SeatHold.find({ expiresAt: { $lte: now } })
    .select('tripId seatId userId')
    .limit(limit);

  if (!expired.length) return;

  const ids = expired.map((hold) => hold._id);
  await SeatHold.deleteMany({ _id: { $in: ids } });

  const io = getIO();
  if (!io) return;

  for (const hold of expired) {
    io.to(`trip:${hold.tripId}`).emit('seat_update', {
      tripId: String(hold.tripId),
      seatId: hold.seatId,
      status: 'available',
      reason: 'hold_expired',
    });
  }
}

function startSeatHoldWatcher({ intervalMs = 5000 } = {}) {
  setInterval(() => {
    expireSeatHoldsOnce().catch(() => undefined);
  }, intervalMs).unref();
}

module.exports = { startSeatHoldWatcher };
