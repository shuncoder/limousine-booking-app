const Trip = require('../models/Trip');
const Ticket = require('../models/Ticket');
const SeatHold = require('../models/SeatHold');
const User = require('../models/User');
const { computePrice, computeDiscount } = require('../utils/pricing');
const { getIO, emitTripSeatCount } = require('../sockets/socket');
const { createAdminLog } = require('../utils/adminAudit');
const { createNotification } = require('../utils/notify');
const { buildRoutePlan } = require('../utils/routeSimulator');
const {
  toInt,
  normalizePoint,
  pickAreaPoint,
  normalizeSeatIds,
  validatePromoCode,
  consumePromo,
  spreadDiscount,
} = require('../utils/bookingValidation');

function formatVnd(amount, currency = 'VND') {
  if (currency === 'VND') {
    try {
      return new Intl.NumberFormat('vi-VN').format(Number(amount || 0)) + 'đ';
    } catch {
      return `${amount} ${currency}`;
    }
  }
  return `${amount} ${currency}`;
}

function formatTripRoute(trip) {
  return `${trip.routeFrom} → ${trip.routeTo}`;
}

function emitTripEvent(tripId, event, payload) {
  const io = getIO();
  if (!io) return;
  io.to(`trip:${tripId}`).emit(event, payload);
}

async function notifyDriverOfBooking({ trip, ticket, customerId, status }) {
  if (!trip?.driverId) return;
  let customerName = '';
  try {
    const customer = await User.findById(customerId).select('name email phone');
    customerName = customer?.name || customer?.email || 'Khách hàng';
  } catch {
    customerName = 'Khách hàng';
  }

  const titleByStatus = {
    pending: 'Có khách đặt vé mới',
    paid: 'Khách đã thanh toán vé',
    cancelled: 'Khách đã hủy vé',
  };

  await createNotification({
    userId: trip.driverId,
    type: 'driver_new_passenger',
    title: titleByStatus[status] || 'Cập nhật vé',
    body: `${customerName} • Ghế ${ticket.seatId} • ${formatTripRoute(trip)}.`,
    tripId: trip._id,
    ticketId: ticket._id,
    metadata: {
      seatId: ticket.seatId,
      customerId: String(customerId),
      customerName,
      status,
    },
  });
}

/**
 * Validates seat ids and the matching pickup/dropoff snapshots from a trip.
 * Returns an object with sanitized values, or { error } payload for the caller.
 */
function buildBookingContext({ trip, body }) {
  const seatIds = normalizeSeatIds(body.seatIds || (body.seatId ? [body.seatId] : []));
  if (!seatIds.length) {
    return { error: { status: 400, msg: 'seatIds là bắt buộc' } };
  }

  for (const seatId of seatIds) {
    if (!trip.seatIds.includes(seatId)) {
      return { error: { status: 400, msg: `Ghế ${seatId} không tồn tại trên chuyến này` } };
    }
  }

  const expectedCount = toInt(body.expectedSeatCount, seatIds.length);
  if (expectedCount > 0 && seatIds.length !== expectedCount) {
    return {
      error: {
        status: 400,
        msg: `Bạn cần chọn đúng ${expectedCount} ghế (hiện đã chọn ${seatIds.length}).`,
      },
    };
  }

  const pickupAreaIdRaw = String(body.pickupAreaId ?? '').trim();
  const pickupSnap = normalizePoint(body.pickupPoint, pickupAreaIdRaw);
  if (!pickupAreaIdRaw || !pickupSnap) {
    return { error: { status: 400, msg: 'pickupAreaId và pickupPoint là bắt buộc' } };
  }

  const pickup = pickAreaPoint({
    areas: trip.pickupAreas || [],
    areaId: pickupAreaIdRaw,
    snapshot: pickupSnap,
  });
  if (!pickup.ok) {
    return {
      error: {
        status: 400,
        msg:
          pickup.reason === 'invalid_area'
            ? 'Khu vực đón không hợp lệ'
            : 'Điểm đón không hợp lệ',
      },
    };
  }

  const dropoffAreaIdRaw = String(body.dropoffAreaId ?? '').trim();
  const dropoffSnap = normalizePoint(body.dropoffPoint, dropoffAreaIdRaw);
  if (!dropoffAreaIdRaw || !dropoffSnap) {
    return { error: { status: 400, msg: 'dropoffAreaId và dropoffPoint là bắt buộc' } };
  }

  const dropoff = pickAreaPoint({
    areas: trip.dropoffAreas || [],
    areaId: dropoffAreaIdRaw,
    snapshot: dropoffSnap,
  });
  if (!dropoff.ok) {
    return {
      error: {
        status: 400,
        msg:
          dropoff.reason === 'invalid_area'
            ? 'Khu vực trả không hợp lệ'
            : 'Điểm trả không hợp lệ',
      },
    };
  }

  return {
    seatIds,
    pickupAreaId: pickupAreaIdRaw,
    pickupSnapshot: pickupSnap,
    dropoffAreaId: dropoffAreaIdRaw,
    dropoffSnapshot: dropoffSnap,
  };
}

async function ensureSeatsHeld({ tripId, userId, seatIds, now }) {
  const holds = await SeatHold.find({
    tripId,
    seatId: { $in: seatIds },
    userId,
    expiresAt: { $gt: now },
  }).select('seatId');
  const heldSet = new Set(holds.map((h) => String(h.seatId)));
  const missing = seatIds.filter((s) => !heldSet.has(s));
  return { ok: missing.length === 0, missing };
}

async function computeQuote({ trip, seatCount, promoCode, now = new Date() }) {
  const activeTicketsCount = await Ticket.countDocuments({
    tripId: trip._id,
    status: { $in: ['pending', 'paid'] },
  });

  const fillRate = trip.totalSeats ? activeTicketsCount / trip.totalSeats : 0;
  const { price: pricePerSeat, multiplier } = computePrice({
    basePrice: trip.basePrice,
    dynamicPricing: trip.dynamicPricing,
    fillRate,
  });

  const subTotal = pricePerSeat * Math.max(0, seatCount);

  let promo = null;
  if (promoCode) {
    promo = await validatePromoCode(promoCode, now);
    if (!promo) {
      return { error: { status: 400, msg: 'Mã giảm giá không hợp lệ' } };
    }
  }

  const { discountAmount } = computeDiscount({ promo, amount: subTotal });
  const totalAmount = Math.max(0, subTotal - discountAmount);

  return {
    pricePerSeat,
    multiplier,
    fillRate,
    seatCount: Math.max(0, seatCount),
    subTotal,
    discountAmount,
    totalAmount,
    currency: trip.currency,
    promo,
  };
}

exports.quoteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const seatCount = Math.max(0, toInt(req.body?.seatCount, 1));
    if (!seatCount) {
      return res.status(400).json({ msg: 'seatCount must be >= 1' });
    }
    if (seatCount > 20) {
      return res.status(400).json({ msg: 'Tối đa 20 ghế / lần đặt' });
    }

    const quote = await computeQuote({
      trip,
      seatCount,
      promoCode: req.body?.promoCode,
    });
    if (quote.error) return res.status(quote.error.status).json({ msg: quote.error.msg });

    res.json({
      tripId: String(trip._id),
      currency: quote.currency,
      pricePerSeat: quote.pricePerSeat,
      multiplier: quote.multiplier,
      fillRate: quote.fillRate,
      seatCount: quote.seatCount,
      subTotal: quote.subTotal,
      discountAmount: quote.discountAmount,
      totalAmount: quote.totalAmount,
      promo: quote.promo
        ? { code: quote.promo.code, type: quote.promo.type, value: quote.promo.value }
        : null,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

async function performBooking({ trip, body, userId, holdRequired = true }) {
  const ctx = buildBookingContext({ trip, body });
  if (ctx.error) return ctx;

  const now = new Date();

  if (holdRequired) {
    const holds = await ensureSeatsHeld({
      tripId: trip._id,
      userId,
      seatIds: ctx.seatIds,
      now,
    });
    if (!holds.ok) {
      return {
        error: {
          status: 409,
          msg: `Các ghế chưa được giữ hoặc đã hết hạn: ${holds.missing.join(', ')}`,
        },
      };
    }
  }

  const quote = await computeQuote({
    trip,
    seatCount: ctx.seatIds.length,
    promoCode: body.promoCode,
    now,
  });
  if (quote.error) return quote;

  const minutes = Math.min(60, Math.max(1, toInt(body.pendingMinutes, 15)));
  const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);

  const discountPerSeat = spreadDiscount(quote.discountAmount, ctx.seatIds.length);

  const docs = ctx.seatIds.map((seatId, idx) => ({
    tripId: trip._id,
    seatId,
    userId,
    pickupAreaId: ctx.pickupAreaId,
    pickupPoint: ctx.pickupSnapshot,
    dropoffAreaId: ctx.dropoffAreaId,
    dropoffPoint: ctx.dropoffSnapshot,
    status: 'pending',
    priceBeforeDiscount: quote.pricePerSeat,
    discountAmount: discountPerSeat[idx] || 0,
    totalAmount: quote.pricePerSeat - (discountPerSeat[idx] || 0),
    currency: trip.currency,
    promoCode: quote.promo ? quote.promo.code : null,
    expiresAt,
  }));

  let tickets;
  try {
    tickets = await Ticket.insertMany(docs, { ordered: true });
  } catch (err) {
    if (err && err.writeErrors) {
      const inserted = err.insertedDocs || [];
      if (inserted.length) {
        await Ticket.deleteMany({ _id: { $in: inserted.map((d) => d._id) } });
      }
    }
    if (String(err?.code) === '11000') {
      return { error: { status: 409, msg: 'Một hoặc nhiều ghế đã được người khác đặt' } };
    }
    throw err;
  }

  if (quote.promo) {
    const ok = await consumePromo(quote.promo, now);
    if (!ok) {
      await Ticket.deleteMany({ _id: { $in: tickets.map((t) => t._id) } });
      return { error: { status: 409, msg: 'Mã giảm giá không còn khả dụng' } };
    }
  }

  await SeatHold.deleteMany({
    tripId: trip._id,
    seatId: { $in: ctx.seatIds },
    userId,
  });

  for (const seatId of ctx.seatIds) {
    emitTripEvent(trip._id, 'seat_booked', {
      tripId: String(trip._id),
      seatId,
    });
  }

  emitTripSeatCount(trip._id).catch(() => undefined);

  // Customer notification (single combined notification for the batch)
  const seatLabel = ctx.seatIds.join(', ');
  await createNotification({
    userId,
    type: 'ticket_created',
    title:
      ctx.seatIds.length > 1 ? 'Đặt nhiều vé thành công' : 'Đặt vé thành công',
    body: `Bạn đã giữ ghế ${seatLabel} cho chuyến ${formatTripRoute(trip)}. Vui lòng thanh toán trong ${minutes} phút.`,
    tripId: trip._id,
    ticketId: tickets[0]._id,
    metadata: {
      seatIds: ctx.seatIds,
      seatCount: ctx.seatIds.length,
      totalAmount: quote.totalAmount,
      currency: trip.currency,
      expiresAt,
    },
  });

  // Driver notification (one per seat, so the dashboard shows them individually)
  if (trip.driverId) {
    for (const ticket of tickets) {
      await notifyDriverOfBooking({ trip, ticket, customerId: userId, status: 'pending' });
    }
  }

  return {
    tickets,
    summary: {
      seatIds: ctx.seatIds,
      seatCount: ctx.seatIds.length,
      pricePerSeat: quote.pricePerSeat,
      subTotal: quote.subTotal,
      discountAmount: quote.discountAmount,
      totalAmount: quote.totalAmount,
      currency: trip.currency,
      promoCode: quote.promo ? quote.promo.code : null,
      expiresAt,
    },
  };
}

exports.createTicket = async (req, res) => {
  try {
    const { tripId } = req.body;
    if (!tripId) return res.status(400).json({ msg: 'tripId is required' });

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const result = await performBooking({
      trip,
      body: req.body,
      userId: req.user.id,
      holdRequired: req.body.holdRequired !== false,
    });

    if (result.error) {
      return res.status(result.error.status).json({ msg: result.error.msg });
    }

    res.status(201).json(result.tickets[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.createBatchTickets = async (req, res) => {
  try {
    const { tripId } = req.body;
    if (!tripId) return res.status(400).json({ msg: 'tripId is required' });

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const result = await performBooking({
      trip,
      body: req.body,
      userId: req.user.id,
      holdRequired: req.body.holdRequired !== false,
    });

    if (result.error) {
      return res.status(result.error.status).json({ msg: result.error.msg });
    }

    res.status(201).json({
      tickets: result.tickets,
      summary: result.summary,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.payTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

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

    emitTripEvent(ticket.tripId, 'seat_paid', {
      tripId: String(ticket.tripId),
      seatId: ticket.seatId,
    });

    const trip = await Trip.findById(ticket.tripId).select(
      'routeFrom routeTo departureAt driverId currency'
    );

    const routePlan = buildRoutePlan({
      seed: ticket._id,
      pickupPoint: ticket.pickupPoint,
    });

    if (trip) {
      await createNotification({
        userId: ticket.userId,
        type: 'ticket_paid',
        title: 'Thanh toán thành công',
        body: `Vé ghế ${ticket.seatId} cho chuyến ${formatTripRoute(trip)} đã được thanh toán (${formatVnd(ticket.totalAmount, ticket.currency)}).`,
        tripId: trip._id,
        ticketId: ticket._id,
        metadata: routePlan
          ? { user: routePlan.user, pickup: routePlan.pickup }
          : null,
      });

      await notifyDriverOfBooking({
        trip,
        ticket,
        customerId: ticket.userId,
        status: 'paid',
      });
    }

    res.json({ ...ticket.toObject(), routePlan });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getTicketRoutePlan = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    const routePlan = buildRoutePlan({
      seed: ticket._id,
      pickupPoint: ticket.pickupPoint,
    });

    if (!routePlan) {
      return res.status(400).json({ msg: 'Cannot build route plan' });
    }

    res.json({
      ticketId: String(ticket._id),
      tripId: String(ticket.tripId),
      seatId: ticket.seatId,
      ...routePlan,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.cancelTicket = async (req, res) => {
  try {
    const { reason } = req.body;

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

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

    emitTripEvent(ticket.tripId, 'seat_release', {
      tripId: String(ticket.tripId),
      seatId: ticket.seatId,
    });

    emitTripSeatCount(ticket.tripId).catch(() => undefined);

    const trip = await Trip.findById(ticket.tripId).select(
      'routeFrom routeTo driverId'
    );
    if (trip) {
      await createNotification({
        userId: ticket.userId,
        type: 'ticket_cancelled',
        title: 'Vé đã được hủy',
        body: `Vé ghế ${ticket.seatId} cho chuyến ${formatTripRoute(trip)} đã bị hủy.`,
        tripId: trip._id,
        ticketId: ticket._id,
      });

      await notifyDriverOfBooking({
        trip,
        ticket,
        customerId: ticket.userId,
        status: 'cancelled',
      });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.requestRefund = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

    if (ticket.status !== 'paid') {
      return res.status(400).json({ msg: 'Only paid tickets can be refunded' });
    }

    const now = new Date();

    if (ticket.refundStatus === 'refunded') {
      return res.status(400).json({ msg: 'Already refunded' });
    }

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
