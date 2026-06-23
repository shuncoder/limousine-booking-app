const Trip = require('../models/Trip');
const SeatHold = require('../models/SeatHold');
const Ticket = require('../models/Ticket');
const { computePrice } = require('../utils/pricing');
const { createAdminLog } = require('../utils/adminAudit');

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePickupAreas(input) {
  if (!Array.isArray(input)) return [];

  return input
    .map((area) => {
      const areaId = String(area?.areaId ?? '').trim();
      const name = String(area?.name ?? '').trim();
      if (!areaId || !name) return null;

      const points = Array.isArray(area?.points)
        ? area.points
            .map((point) => {
              const pointName = String(point?.name ?? '').trim();
              const address = String(point?.address ?? '').trim();
              const lat = Number(point?.lat);
              const lng = Number(point?.lng);
              const pointAreaId = String(point?.areaId ?? areaId).trim();

              if (!pointName || !address || !Number.isFinite(lat) || !Number.isFinite(lng) || !pointAreaId) {
                return null;
              }

              return {
                name: pointName,
                address,
                lat,
                lng,
                areaId: pointAreaId,
              };
            })
            .filter(Boolean)
        : [];

      return {
        areaId,
        name,
        featured: Boolean(area?.featured),
        points,
      };
    })
    .filter(Boolean);
}

exports.createTrip = async (req, res) => {
  try {
    const {
      routeFrom,
      routeTo,
      departureAt,
      vehicleName,
      driverId,
      basePrice,
      currency,
      seatLayout,
      seatLayoutConfig,
      dynamicPricing,
      pickupAreas,
      dropoffAreas,
    } = req.body;

    if (!routeFrom || !routeTo || !departureAt) {
      return res.status(400).json({ msg: 'routeFrom, routeTo, departureAt are required' });
    }

    const cleanedPickup = normalizePickupAreas(pickupAreas);
    const cleanedDropoff = normalizePickupAreas(dropoffAreas);

    if (
      !cleanedPickup.length ||
      cleanedPickup.every((area) => !Array.isArray(area.points) || area.points.length === 0)
    ) {
      return res.status(400).json({
        msg: 'Cần ít nhất 1 khu vực đón hợp lệ kèm điểm chi tiết',
      });
    }

    if (
      !cleanedDropoff.length ||
      cleanedDropoff.every((area) => !Array.isArray(area.points) || area.points.length === 0)
    ) {
      return res.status(400).json({
        msg: 'Cần ít nhất 1 khu vực trả hợp lệ kèm điểm chi tiết',
      });
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
    // phần in log để theo dõi
    console.log('[createTrip] payload pickup/dropoff sizes', {
      pickupAreasInput: Array.isArray(pickupAreas) ? pickupAreas.length : 0,
      pickupAreasCleaned: cleanedPickup.length,
      pickupPointsCleaned: cleanedPickup.reduce((sum, a) => sum + (a.points?.length || 0), 0),
      dropoffAreasInput: Array.isArray(dropoffAreas) ? dropoffAreas.length : 0,
      dropoffAreasCleaned: cleanedDropoff.length,
      dropoffPointsCleaned: cleanedDropoff.reduce((sum, a) => sum + (a.points?.length || 0), 0),
    });

    const trip = await Trip.create({
      routeFrom,
      routeTo,
      departureAt,
      vehicleName: vehicleName ?? null,
      driverId: driverId || null,
      basePrice,
      currency: currency || 'VND',
      seatLayout: finalSeatLayout,
      dynamicPricing: dynamicPricing ?? undefined,
      pickupAreas: cleanedPickup,
      dropoffAreas: cleanedDropoff,
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
    console.error('[createTrip] error:', err);
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

    const sort =
      req.query.sort === 'createdAtDesc'
        ? { createdAt: -1, _id: -1 }
        : { departureAt: 1 };

    const [items, total] = await Promise.all([
      Trip.find(query).sort(sort).skip(skip).limit(limit),
      Trip.countDocuments(query),
    ]);

    if (!items.length) {
      return res.json({ items, page, limit, total });
    }

    const tripIds = items.map((trip) => trip._id);
    // Count tickets (pending/paid)
    const bookedCounts = await Ticket.aggregate([
      {
        $match: {
          tripId: { $in: tripIds },
          status: { $in: ['pending', 'paid'] },
        },
      },
      { $group: { _id: '$tripId', count: { $sum: 1 } } },
    ]);

    // Count seat holds (not expired)
    const now = new Date();
    const holdCounts = await require('../models/SeatHold').aggregate([
      {
        $match: {
          tripId: { $in: tripIds },
          expiresAt: { $gt: now },
        },
      },
      { $group: { _id: '$tripId', count: { $sum: 1 } } },
    ]);

    const bookedByTrip = new Map(bookedCounts.map((item) => [String(item._id), Number(item.count || 0)]));
    const heldByTrip = new Map(holdCounts.map((item) => [String(item._id), Number(item.count || 0)]));

    const itemsWithSeats = items.map((trip) => {
      const bookedSeats = bookedByTrip.get(String(trip._id)) || 0;
      const heldSeats = heldByTrip.get(String(trip._id)) || 0;
      const totalSeats = trip.totalSeats || trip.seatIds?.length || 0;
      return {
        ...trip.toObject(),
        bookedSeats,
        heldSeats,
        availableSeats: Math.max(0, totalSeats - bookedSeats - heldSeats),
      };
    });

    res.json({ items: itemsWithSeats, page, limit, total });
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
    const allowed = [
      'routeFrom',
      'routeTo',
      'departureAt',
      'vehicleName',
      'driverId',
      'basePrice',
      'currency',
      'seatLayout',
      'dynamicPricing',
      'status',
      'pickupAreas',
      'dropoffAreas',
    ];
    for (const key of allowed) {
      if (typeof req.body[key] !== 'undefined') patch[key] = req.body[key];
    }

    if (typeof patch.pickupAreas !== 'undefined') {
      patch.pickupAreas = normalizePickupAreas(patch.pickupAreas);
    }

    if (typeof patch.dropoffAreas !== 'undefined') {
      patch.dropoffAreas = normalizePickupAreas(patch.dropoffAreas);
    }

    const trip = await Trip.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    });
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
    console.error('[updateTrip] error:', err);
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

exports.listMyDriverTrips = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ msg: 'Unauthorized' });
    if (req.user.role !== 'driver') return res.status(403).json({ msg: 'Forbidden' });

    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 50)));
    const skip = (page - 1) * limit;

    const query = { driverId: req.user.id };
    if (req.query.status) query.status = String(req.query.status);

    if (req.query.upcoming === 'true') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      query.departureAt = { $gte: startOfToday };
    }

    const [items, total] = await Promise.all([
      Trip.find(query).sort({ departureAt: 1 }).skip(skip).limit(limit),
      Trip.countDocuments(query),
    ]);

    if (!items.length) {
      return res.json({ items, page, limit, total });
    }

    const tripIds = items.map((trip) => trip._id);
    const bookedCounts = await Ticket.aggregate([
      { $match: { tripId: { $in: tripIds }, status: { $in: ['pending', 'paid'] } } },
      { $group: { _id: '$tripId', count: { $sum: 1 } } },
    ]);

    const bookedByTrip = new Map(
      bookedCounts.map((item) => [String(item._id), Number(item.count || 0)])
    );

    const itemsWithSeats = items.map((trip) => {
      const bookedSeats = bookedByTrip.get(String(trip._id)) || 0;
      const totalSeats = trip.totalSeats || trip.seatIds?.length || 0;
      return {
        ...trip.toObject(),
        bookedSeats,
        availableSeats: Math.max(0, totalSeats - bookedSeats),
      };
    });

    res.json({ items: itemsWithSeats, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listTripPassengers = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ msg: 'Unauthorized' });

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const role = req.user.role;
    const isDriverOfTrip =
      role === 'driver' && String(trip.driverId || '') === String(req.user.id);
    const isStaffOrAdmin = role === 'admin' || role === 'staff';

    if (!isDriverOfTrip && !isStaffOrAdmin) {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    const tickets = await Ticket.find({
      tripId: trip._id,
      status: { $in: ['pending', 'paid'] },
    })
      .sort({ seatId: 1 })
      .populate('userId', 'name email phone avatar');

    res.json({
      tripId: String(trip._id),
      trip: {
        _id: trip._id,
        routeFrom: trip.routeFrom,
        routeTo: trip.routeTo,
        departureAt: trip.departureAt,
        vehicleName: trip.vehicleName,
        totalSeats: trip.totalSeats,
        status: trip.status,
        currency: trip.currency,
      },
      passengers: tickets,
      total: tickets.length,
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
