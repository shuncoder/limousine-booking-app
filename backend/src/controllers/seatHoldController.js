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
    if (!req.user?.id) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const { seatId, holdMinutes } = req.body;
    if (!seatId) return res.status(400).json({ msg: 'seatId is required' });

    const seatKey = String(seatId);

    if (!Array.isArray(trip.seatIds) || !trip.seatIds.includes(seatKey)) {
      return res.status(400).json({ msg: 'Invalid seatId' });
    }

    const now = new Date();
    const minutes = Math.min(30, Math.max(1, toInt(holdMinutes, 5)));
    const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);

    const existingTicket = await Ticket.findOne({
      tripId: trip._id,
      seatId: seatKey,
      status: { $in: ['pending', 'paid'] },
    });

    if (existingTicket) {
      return res.status(409).json({ msg: 'Seat already reserved' });
    }

    let hold;

    const existingHold = await SeatHold.findOne({
      tripId: trip._id,
      seatId: seatKey,
    });

    if (existingHold) {
      if (
        existingHold.expiresAt > now &&
        existingHold.userId.toString() !== String(req.user?.id)
      ) {
        return res.status(409).json({
          msg: 'Seat is being held by another user',
        });
      }

      existingHold.userId = req.user.id;
      existingHold.expiresAt = expiresAt;
      await existingHold.save();

      hold = existingHold;
    } else {
      hold = await SeatHold.create({
        tripId: trip._id,
        seatId: seatKey,
        userId: req.user.id,
        expiresAt,
      });
    }

    const io = getIO();
    if (io) {
      io.to(`trip:${trip._id}`).emit('seat_hold', {
        tripId: String(trip._id),
        seatId: hold.seatId,
        userId: req.user.id,
        expiresAt: hold.expiresAt,
      });
    }

    res.json(hold);
  } catch (err) {
    console.error("HOLD SEAT ERROR:", err); 
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.releaseSeat = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const tripId = req.params.id;
    const seatId = String(req.params.seatId ?? '').trim();
    if (!seatId) return res.status(400).json({ msg: 'seatId is required' });

    await SeatHold.deleteOne({
      tripId,
      seatId,
      userId: req.user.id,
    });

    const io = getIO();
    if (io) {
      io.to(`trip:${tripId}`).emit('seat_release', {
        tripId: String(tripId),
        seatId,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("RELEASE SEAT ERROR:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};