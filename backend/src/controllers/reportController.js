const Trip = require('../models/Trip');
const Ticket = require('../models/Ticket');
const SeatHold = require('../models/SeatHold');

const TZ = process.env.APP_TIMEZONE || 'Asia/Ho_Chi_Minh';

function resolveDateRange(req) {
  const fromRaw = req.query?.from ?? req.body?.from;
  const toRaw = req.query?.to ?? req.body?.to;
  const now = new Date();
  let to = toRaw ? new Date(String(toRaw)) : now;
  if (Number.isNaN(to.getTime())) to = now;
  let from = fromRaw ? new Date(String(fromRaw)) : null;
  if (!from || Number.isNaN(from.getTime())) {
    from = new Date(to);
    from.setDate(from.getDate() - 90);
  }
  if (from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  return { from, to };
}

exports.revenueByRoute = async (req, res) => {
  try {
    const hasExplicitRange = !!(
      req.query?.from ||
      req.query?.to ||
      req.body?.from ||
      req.body?.to
    );

    const matchStage = { status: 'paid' };

    if (!hasExplicitRange) {
      // Original behavior when no dates: aggregate all paid tickets
      const rows = await Ticket.aggregate([
        { $match: matchStage },
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
      return res.json({
        items: rows.map((r) => ({ ...r._id, revenue: r.revenue, tickets: r.tickets })),
      });
    }

    const { from, to } = resolveDateRange(req);
    const rows = await Ticket.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          revenueAt: { $ifNull: ['$paidAt', '$createdAt'] },
        },
      },
      {
        $match: {
          revenueAt: { $gte: from, $lte: to },
        },
      },
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

/**
 * Paid tickets aggregated by calendar day/month (VN timezone).
 * Useful for dashboard line charts. Uses paidAt, falls back to createdAt.
 */
exports.revenueOverTime = async (req, res) => {
  try {
    const { from, to } = resolveDateRange(req);
    const granularity = String(req.query.granularity || 'day') === 'month' ? 'month' : 'day';
    const dateFormat = granularity === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const items = await Ticket.aggregate([
      { $match: { status: 'paid' } },
      {
        $addFields: {
          revenueAt: { $ifNull: ['$paidAt', '$createdAt'] },
        },
      },
      {
        $match: {
          revenueAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$revenueAt', timezone: TZ },
          },
          revenue: { $sum: '$totalAmount' },
          tickets: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          revenue: 1,
          tickets: 1,
        },
      },
    ]);

    res.json({
      granularity,
      from: from.toISOString(),
      to: to.toISOString(),
      items,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * Body: { question?: string, from?: string (ISO), to?: string }
 * Sends anonymized aggregates to OpenAI; returns Markdown-friendly analysis text.
 */
exports.analyzeRevenueWithAi = async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || String(apiKey).trim().length < 10) {
      return res.status(503).json({
        msg: 'Chưa cấu hình OPENAI_API_KEY trên máy chủ (.env)',
      });
    }

    const { from, to } = resolveDateRange(req);
    const granularity = Number(to - from) > 180 * 24 * 60 * 60 * 1000 ? 'month' : 'day';

    const dateFormat = granularity === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const baseDateMatch = [
      { $match: { status: 'paid' } },
      {
        $addFields: {
          revenueAt: { $ifNull: ['$paidAt', '$createdAt'] },
        },
      },
      {
        $match: {
          revenueAt: { $gte: from, $lte: to },
        },
      },
    ];

    const [periodTotals, routeAgg, timelineAgg] = await Promise.all([
      Ticket.aggregate([
        ...baseDateMatch,
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalAmount' },
            tickets: { $sum: 1 },
          },
        },
      ]),
      Ticket.aggregate([
        ...baseDateMatch,
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
        { $limit: 20 },
      ]),
      Ticket.aggregate([
        ...baseDateMatch,
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: '$revenueAt', timezone: TZ },
            },
            revenue: { $sum: '$totalAmount' },
            tickets: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalRevenue = periodTotals[0]?.revenue ?? 0;
    const totalTickets = periodTotals[0]?.tickets ?? 0;

    const routes = routeAgg.map((r) => ({
      route: `${r._id.routeFrom} → ${r._id.routeTo}`,
      revenue: r.revenue,
      tickets: r.tickets,
    }));
    const timeline = timelineAgg.map((r) => ({
      period: r._id,
      revenue: r.revenue,
      tickets: r.tickets,
    }));

    let userQuestion = String(req.body?.question || '').trim();
    if (!userQuestion) {
      userQuestion =
        'Hãy tóm tắt ngắn gọn hiệu suất doanh thu, chỉ ra tuyến mạnh/yếu và 2–3 gợi ý hành động cho quản trị.';
    }
    if (userQuestion.length > 1200) {
      userQuestion = `${userQuestion.slice(0, 1197)}...`;
    }

    const snapshot = JSON.stringify(
      {
        currency: 'VND',
        from: from.toISOString(),
        to: to.toISOString(),
        totalRevenue,
        totalTickets,
        routes,
        timeline,
      },
      null,
      2
    );

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const openaiUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';

    const openaiBody = JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content:
            'Bạn là chuyên gia phân tích cho dịch vụ xe limousine tại Việt Nam. ' +
            'Trả lời bằng tiếng Việt, súc tích. Dựa chỉ vào JSON dữ liệu được cung cấp. ' +
            'Nếu dữ liệu thưa hoặc bằng 0, hãy nêu rõ và đề xuất thu thập thêm.',
        },
        {
          role: 'user',
          content: `${userQuestion}\n\nDữ liệu tổng hợp (aggregate):\n${snapshot}`,
        },
      ],
    });

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 55000);

    let openaiResponse;
    try {
      openaiResponse = await fetch(openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: openaiBody,
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(tid);
    }

    const raw = await openaiResponse.json().catch(() => ({}));
    if (!openaiResponse.ok) {
      const errMsg =
        raw?.error?.message || raw?.msg || `OpenAI HTTP ${openaiResponse.status}`;
      return res.status(502).json({ msg: String(errMsg) });
    }

    const text =
      raw?.choices?.[0]?.message?.content?.trim?.() ||
      'Không nhận được nội dung phản hồi từ mô hình.';

    res.json({
      analysis: text,
      model,
      snapshotMeta: {
        from: from.toISOString(),
        to: to.toISOString(),
        totalRevenue,
        totalTickets,
        routeRows: routes.length,
        timelinePoints: timeline.length,
      },
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      return res.status(504).json({ msg: 'Hết thời gian chờ phản hồi AI (timeout)' });
    }
    console.error('[analyzeRevenueWithAi]', err);
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
