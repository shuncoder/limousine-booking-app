const Ticket = require('../models/Ticket');
const { getIO } = require('../sockets/socket');
const { createNotification } = require('../utils/notify');

async function expirePendingTicketsOnce() {
  const now = new Date();
  const toExpire = await Ticket.find({
    status: 'pending',
    expiresAt: { $ne: null, $lte: now },
  })
    .select('tripId seatId userId')
    .limit(500);

  if (!toExpire.length) return;

  const ids = toExpire.map((t) => t._id);
  await Ticket.updateMany(
    { _id: { $in: ids }, status: 'pending' },
    { $set: { status: 'expired', expiredAt: now } }
  );

  const io = getIO();

  for (const t of toExpire) {
    if (io) {
      io.to(`trip:${t.tripId}`).emit('seat_update', {
        tripId: String(t.tripId),
        seatId: t.seatId,
        status: 'available',
        reason: 'ticket_expired',
      });
    }

    if (t.userId) {
      createNotification({
        userId: t.userId,
        type: 'ticket_expired',
        title: 'Vé đã hết hạn',
        body: `Vé giữ ghế ${t.seatId} đã hết thời gian thanh toán và đã được giải phóng.`,
        tripId: t.tripId,
        ticketId: t._id,
      }).catch(() => undefined);
    }
  }
}

function startSeatJobs({ ticketExpireIntervalMs = 15000 } = {}) {
  setInterval(() => {
    expirePendingTicketsOnce().catch(() => undefined);
  }, ticketExpireIntervalMs).unref();
}

module.exports = { startSeatJobs };
