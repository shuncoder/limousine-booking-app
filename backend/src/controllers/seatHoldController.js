const Trip = require('../models/Trip');
const SeatHold = require('../models/SeatHold');
const Ticket = require('../models/Ticket');
const { getIO } = require('../sockets/socket');

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

exports.holdSeat = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const { seatId, holdMinutes } = req.body;
    if (!seatId) return res.status(400).json({ msg: 'seatId is required' });
    if (!trip.seatIds.includes(String(seatId))) {
      return res.status(400).json({ msg: 'Invalid seatId' });
    }

    const now = new Date();
    const minutes = Math.min(30, Math.max(1, toInt(holdMinutes, 5)));
    const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);

    const existingTicket = await Ticket.findOne({
      tripId: trip._id,
      seatId: String(seatId),
      status: { $in: ['pending', 'paid'] },
    }).select('_id');

    if (existingTicket) {
      return res.status(409).json({ msg: 'Seat already reserved' });
    }

    let hold;
    try {
      hold = await SeatHold.findOneAndUpdate(
        {
          tripId: trip._id,
          seatId: String(seatId),
          $or: [{ userId: req.user.id }, { expiresAt: { $lte: now } }],
        },
        { $set: { userId: req.user.id, expiresAt } },
        { upsert: true, new: true }
      );
    } catch (err) {
      if (String(err?.code) === '11000') {
        return res.status(409).json({ msg: 'Seat already held' });
      }
      throw err;
    }

    // If we didn't match (seat held by someone else and not expired), upsert will hit duplicate key.
    if (!hold) {
      return res.status(409).json({ msg: 'Seat already held' });
    }

    const io = getIO();
    if (io) {
      io.to(`trip:${trip._id}`).emit('seat_update', {
        tripId: String(trip._id),
        seatId: hold.seatId,
        status: 'held',
        expiresAt: hold.expiresAt,
      });
    }

    res.status(201).json({
      tripId: String(trip._id),
      seatId: hold.seatId,
      expiresAt: hold.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.releaseSeat = async (req, res) => {
  try {
    const tripId = req.params.id;
    const seatId = String(req.params.seatId);

    const hold = await SeatHold.findOneAndDelete({ tripId, seatId, userId: req.user.id });
    if (!hold) return res.status(404).json({ msg: 'Hold not found' });

    const io = getIO();
    if (io) {
      io.to(`trip:${tripId}`).emit('seat_update', {
        tripId: String(tripId),
        seatId,
        status: 'available',
        reason: 'released',
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
