const Trip = require('../models/Trip');
const Ticket = require('../models/Ticket');
const SeatHold = require('../models/SeatHold');

exports.revenueByRoute = async (req, res) => {
  try {
    const match = { status: 'paid' };

    if (req.query.from || req.query.to) {
      match.createdAt = {};
      if (req.query.from) match.createdAt.$gte = new Date(String(req.query.from));
      if (req.query.to) match.createdAt.$lte = new Date(String(req.query.to));
      if (Object.keys(match.createdAt).length === 0) delete match.createdAt;
    }

    const rows = await Ticket.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'trips',
          localField: 'tripId',
          foreignField: '_id',
          as: 'trip',
        },
      },
      { $unwind: '$trip' },
      {
        $group: {
          _id: { routeFrom: '$trip.routeFrom', routeTo: '$trip.routeTo' },
          revenue: { $sum: '$totalAmount' },
          tickets: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({ items: rows.map((r) => ({ ...r._id, revenue: r.revenue, tickets: r.tickets })) });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.fillRate = async (req, res) => {
  try {
    const now = new Date();

    const query = {};
    if (req.query.tripId) query._id = req.query.tripId;

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

    const trips = await Trip.find(query).sort({ departureAt: 1 }).limit(200);
    const tripIds = trips.map((t) => t._id);

    const [paidCounts, pendingCounts, holdCounts] = await Promise.all([
      Ticket.aggregate([
        { $match: { tripId: { $in: tripIds }, status: 'paid' } },
        { $group: { _id: '$tripId', count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { tripId: { $in: tripIds }, status: 'pending', expiresAt: { $gt: now } } },
        { $group: { _id: '$tripId', count: { $sum: 1 } } },
      ]),
      SeatHold.aggregate([
        { $match: { tripId: { $in: tripIds }, expiresAt: { $gt: now } } },
        { $group: { _id: '$tripId', count: { $sum: 1 } } },
      ]),
    ]);

    const paidMap = Object.fromEntries(paidCounts.map((x) => [String(x._id), x.count]));
    const pendingMap = Object.fromEntries(pendingCounts.map((x) => [String(x._id), x.count]));
    const holdMap = Object.fromEntries(holdCounts.map((x) => [String(x._id), x.count]));

    const items = trips.map((trip) => {
      const totalSeats = trip.totalSeats || 0;
      const paid = paidMap[String(trip._id)] || 0;
      const pending = pendingMap[String(trip._id)] || 0;
      const held = holdMap[String(trip._id)] || 0;
      const fillRatePaid = totalSeats ? paid / totalSeats : 0;
      const fillRateOccupied = totalSeats ? (paid + pending + held) / totalSeats : 0;

      return {
        tripId: String(trip._id),
        routeFrom: trip.routeFrom,
        routeTo: trip.routeTo,
        departureAt: trip.departureAt,
        totalSeats,
        paid,
        pending,
        held,
        fillRatePaid,
        fillRateOccupied,
      };
    });

    res.json({ items });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
