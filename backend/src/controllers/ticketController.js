const Trip = require('../models/Trip');
const Ticket = require('../models/Ticket');
const SeatHold = require('../models/SeatHold');
const Promo = require('../models/Promo');
const { computePrice, computeDiscount } = require('../utils/pricing');
const { getIO } = require('../sockets/socket');
const { createAdminLog } = require('../utils/adminAudit');

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

async function validatePromoCode(code, now) {
  if (!code) return null;
  const normalized = String(code).trim().toUpperCase();
  if (!normalized) return null;

  const promo = await Promo.findOne({ code: normalized, active: true });
  if (!promo) return null;
  if (promo.startsAt && promo.startsAt > now) return null;
  if (promo.endsAt && promo.endsAt < now) return null;
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return null;
  return promo;
}

async function consumePromo(promo, now) {
  if (!promo) return true;

  const query = {
    _id: promo._id,
    active: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  };

  if (promo.maxUses != null) {
    query.usedCount = { $lt: promo.maxUses };
  }

  const updated = await Promo.findOneAndUpdate(query, { $inc: { usedCount: 1 } }, { new: true });
  return Boolean(updated);
}

exports.createTicket = async (req, res) => {
  try {
    const { tripId, seatId, promoCode, holdRequired = true, pendingMinutes } = req.body;
    if (!tripId || !seatId) return res.status(400).json({ msg: 'tripId and seatId are required' });

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const normalizedSeatId = String(seatId);
    if (!trip.seatIds.includes(normalizedSeatId)) {
      return res.status(400).json({ msg: 'Invalid seatId' });
    }

    const now = new Date();

    if (holdRequired) {
      const hold = await SeatHold.findOne({ tripId: trip._id, seatId: normalizedSeatId, userId: req.user.id, expiresAt: { $gt: now } });
      if (!hold) {
        return res.status(409).json({ msg: 'Seat must be held before creating a ticket' });
      }
    }

    const activeTicketsCount = await Ticket.countDocuments({ tripId: trip._id, status: { $in: ['pending', 'paid'] } });
    const fillRate = trip.totalSeats ? activeTicketsCount / trip.totalSeats : 0;
    const { price: priceBeforeDiscount } = computePrice({ basePrice: trip.basePrice, dynamicPricing: trip.dynamicPricing, fillRate });

    let promo = null;
    if (promoCode) {
      promo = await validatePromoCode(promoCode, now);
      if (!promo) return res.status(400).json({ msg: 'Invalid promo code' });
    }

    const { discountAmount } = computeDiscount({ promo, amount: priceBeforeDiscount });
    const totalAmount = Math.max(0, priceBeforeDiscount - discountAmount);

    const minutes = Math.min(60, Math.max(1, toInt(pendingMinutes, 15)));
    const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);

    let ticket;
    try {
      ticket = await Ticket.create({
        tripId: trip._id,
        seatId: normalizedSeatId,
        userId: req.user.id,
        status: 'pending',
        priceBeforeDiscount,
        discountAmount,
        totalAmount,
        currency: trip.currency,
        promoCode: promo ? promo.code : null,
        expiresAt,
      });
    } catch (err) {
      if (String(err?.code) === '11000') {
        return res.status(409).json({ msg: 'Seat already reserved' });
      }
      throw err;
    }

    // Consume promo only after ticket is created; rollback if consumption fails.
    if (promo) {
      const ok = await consumePromo(promo, now);
      if (!ok) {
        await Ticket.deleteOne({ _id: ticket._id });
        return res.status(409).json({ msg: 'Promo is no longer available' });
      }
    }

    await SeatHold.deleteOne({ tripId: trip._id, seatId: normalizedSeatId, userId: req.user.id });

    const io = getIO();
    if (io) {
      io.to(`trip:${trip._id}`).emit('seat_update', {
        tripId: String(trip._id),
        seatId: normalizedSeatId,
        status: 'pending',
        expiresAt,
      });
    }

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.payTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    if (ticket.status !== 'pending') {
      return res.status(400).json({ msg: 'Ticket is not pending' });
    }

    const now = new Date();
    if (ticket.expiresAt && ticket.expiresAt <= now) {
      ticket.status = 'expired';
      ticket.expiredAt = now;
      await ticket.save();
      return res.status(409).json({ msg: 'Ticket expired' });
    }

    ticket.status = 'paid';
    ticket.paidAt = now;
    await ticket.save();

    const io = getIO();
    if (io) {
      io.to(`trip:${ticket.tripId}`).emit('seat_update', {
        tripId: String(ticket.tripId),
        seatId: ticket.seatId,
        status: 'paid',
      });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.cancelTicket = async (req, res) => {
  try {
    const { reason } = req.body;
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    if (!['pending', 'paid'].includes(ticket.status)) {
      return res.status(400).json({ msg: 'Ticket cannot be cancelled' });
    }

    const now = new Date();

    ticket.status = 'cancelled';
    ticket.cancelledAt = now;
    ticket.cancelReason = reason ?? null;

    if (ticket.refundStatus === 'none' && ticket.paidAt) {
      ticket.refundStatus = 'requested';
      ticket.refundRequestedAt = now;
    }

    await ticket.save();

    const io = getIO();
    if (io) {
      io.to(`trip:${ticket.tripId}`).emit('seat_update', {
        tripId: String(ticket.tripId),
        seatId: ticket.seatId,
        status: 'available',
        reason: 'ticket_cancelled',
      });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.requestRefund = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    if (ticket.status !== 'paid') {
      return res.status(400).json({ msg: 'Only paid tickets can be refunded' });
    }

    const now = new Date();
    if (ticket.refundStatus === 'refunded') return res.status(400).json({ msg: 'Already refunded' });

    ticket.refundStatus = 'requested';
    ticket.refundRequestedAt = now;
    await ticket.save();

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.approveRefund = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    if (ticket.refundStatus !== 'requested') {
      return res.status(400).json({ msg: 'Refund is not requested' });
    }

    const now = new Date();
    ticket.refundStatus = 'refunded';
    ticket.refundedAt = now;
    await ticket.save();

    if (req.user?.id) {
      await createAdminLog({
        adminUserId: req.user.id,
        action: 'update',
        entityType: 'ticket_refund',
        entityId: ticket.id,
        details: `Approved refund for ticket ${ticket.id}`,
      });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listMyTickets = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    if (req.query.status) query.status = String(req.query.status);

    const [items, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('tripId'),
      Ticket.countDocuments(query),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.adminListTickets = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.tripId) query.tripId = req.query.tripId;
    if (req.query.status) query.status = String(req.query.status);
    if (req.query.refundStatus) query.refundStatus = String(req.query.refundStatus);

    const [items, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('tripId')
        .populate('userId', 'name email phone role'),
      Ticket.countDocuments(query),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
