const Trip = require('../models/Trip');
const SeatHold = require('../models/SeatHold');
const Ticket = require('../models/Ticket');
const { computePrice } = require('../utils/pricing');
const { createAdminLog } = require('../utils/adminAudit');

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

exports.createTrip = async (req, res) => {
  try {
    const {
      routeFrom,
      routeTo,
      departureAt,
      vehicleName,
      basePrice,
      currency,
      seatLayout,
      seatLayoutConfig,
      dynamicPricing,
    } = req.body;

    if (!routeFrom || !routeTo || !departureAt) {
      return res.status(400).json({ msg: 'routeFrom, routeTo, departureAt are required' });
    }

    let finalSeatLayout = seatLayout;
    if (!finalSeatLayout) {
      const cfg = seatLayoutConfig || {};
      finalSeatLayout = Trip.buildSeatLayout({
        rowCount: toInt(cfg.rowCount, 10),
        leftCount: toInt(cfg.leftCount, 2),
        rightCount: toInt(cfg.rightCount, 2),
      });
    }

    const trip = await Trip.create({
      routeFrom,
      routeTo,
      departureAt,
      vehicleName: vehicleName ?? null,
      basePrice,
      currency: currency || 'VND',
      seatLayout: finalSeatLayout,
      dynamicPricing: dynamicPricing ?? undefined,
    });

    if (req.user?.id) {
      await createAdminLog({
        adminUserId: req.user.id,
        action: 'create',
        entityType: 'trip',
        entityId: trip.id,
        details: `Created trip ${trip.routeFrom} -> ${trip.routeTo}`,
      });
    }

    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listTrips = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.routeFrom) query.routeFrom = String(req.query.routeFrom);
    if (req.query.routeTo) query.routeTo = String(req.query.routeTo);
    if (req.query.status) query.status = String(req.query.status);

    if (req.query.date) {
      const date = new Date(String(req.query.date));
      if (!Number.isNaN(date.getTime())) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        query.departureAt = { $gte: start, $lte: end };
      }
    }

    const [items, total] = await Promise.all([
      Trip.find(query).sort({ departureAt: 1 }).skip(skip).limit(limit),
      Trip.countDocuments(query),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const patch = {};
    const allowed = ['routeFrom', 'routeTo', 'departureAt', 'vehicleName', 'basePrice', 'currency', 'seatLayout', 'dynamicPricing', 'status'];
    for (const key of allowed) {
      if (typeof req.body[key] !== 'undefined') patch[key] = req.body[key];
    }

    const trip = await Trip.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    if (req.user?.id) {
      await createAdminLog({
        adminUserId: req.user.id,
        action: 'update',
        entityType: 'trip',
        entityId: trip.id,
        details: `Updated trip ${trip.routeFrom} -> ${trip.routeTo}`,
        metadata: patch,
      });
    }

    res.json(trip);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const tripId = req.params.id;

    const activeTickets = await Ticket.countDocuments({
      tripId,
      status: { $in: ['pending', 'paid'] },
    });

    if (activeTickets > 0) {
      return res.status(400).json({
        msg: 'Không thể xóa chuyến vì đang có vé pending/paid',
      });
    }

    const trip = await Trip.findByIdAndDelete(tripId);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    await SeatHold.deleteMany({ tripId });
    await Ticket.deleteMany({ tripId, status: { $in: ['cancelled', 'expired'] } });

    if (req.user?.id) {
      await createAdminLog({
        adminUserId: req.user.id,
        action: 'delete',
        entityType: 'trip',
        entityId: tripId,
        details: `Deleted trip ${trip.routeFrom} -> ${trip.routeTo}`,
      });
    }

    res.json({ ok: true, id: tripId });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getTripSeats = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const now = new Date();

    const [holds, tickets] = await Promise.all([
      SeatHold.find({ tripId: trip._id, expiresAt: { $gt: now } }).select('seatId userId expiresAt'),
      Ticket.find({ tripId: trip._id, status: { $in: ['pending', 'paid'] } }).select('seatId status userId expiresAt'),
    ]);

    const seatStatusById = {};

    for (const hold of holds) {
      seatStatusById[hold.seatId] = {
        status: 'held',
        heldByMe: String(hold.userId) === String(req.user.id),
        expiresAt: hold.expiresAt,
      };
    }

    for (const ticket of tickets) {
      seatStatusById[ticket.seatId] = {
        status: ticket.status,
        heldByMe: String(ticket.userId) === String(req.user.id),
        expiresAt: ticket.status === 'pending' ? ticket.expiresAt : null,
      };
    }

    for (const seatId of trip.seatIds) {
      if (!seatStatusById[seatId]) seatStatusById[seatId] = { status: 'available' };
    }

    res.json({
      tripId: String(trip._id),
      seatLayout: trip.seatLayout,
      seats: seatStatusById,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getTripPricePreview = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const now = new Date();

    const [activeTicketsCount] = await Promise.all([
      Ticket.countDocuments({ tripId: trip._id, status: { $in: ['pending', 'paid'] } }),
    ]);

    const fillRate = trip.totalSeats ? activeTicketsCount / trip.totalSeats : 0;
    const { price, multiplier } = computePrice({ basePrice: trip.basePrice, dynamicPricing: trip.dynamicPricing, fillRate });

    res.json({
      tripId: String(trip._id),
      basePrice: trip.basePrice,
      multiplier,
      fillRate,
      price,
      currency: trip.currency,
      at: now,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
