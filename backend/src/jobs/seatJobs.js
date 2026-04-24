const SeatHold = require('../models/SeatHold');
const Ticket = require('../models/Ticket');
const { getIO } = require('../sockets/socket');

async function expireSeatHoldsOnce() {
  const now = new Date();
  const expired = await SeatHold.find({ expiresAt: { $lte: now } })
    .select('tripId seatId userId')
    .limit(500);

  if (!expired.length) return;

  const ids = expired.map((x) => x._id);
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

async function expirePendingTicketsOnce() {
  const now = new Date();
  const toExpire = await Ticket.find({
    status: 'pending',
    expiresAt: { $ne: null, $lte: now },
  })
    .select('tripId seatId')
    .limit(500);

  if (!toExpire.length) return;

  const ids = toExpire.map((t) => t._id);
  await Ticket.updateMany(
    { _id: { $in: ids }, status: 'pending' },
    { $set: { status: 'expired', expiredAt: now } }
  );

  const io = getIO();
  if (!io) return;

  for (const t of toExpire) {
    io.to(`trip:${t.tripId}`).emit('seat_update', {
      tripId: String(t.tripId),
      seatId: t.seatId,
      status: 'available',
      reason: 'ticket_expired',
    });
  }
}

function startSeatJobs({ holdIntervalMs = 5000, ticketExpireIntervalMs = 15000 } = {}) {
  setInterval(() => {
    expireSeatHoldsOnce().catch(() => undefined);
  }, holdIntervalMs).unref();

  setInterval(() => {
    expirePendingTicketsOnce().catch(() => undefined);
  }, ticketExpireIntervalMs).unref();
}

module.exports = { startSeatJobs };
