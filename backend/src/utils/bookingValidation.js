const Promo = require('../models/Promo');

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePoint(point, fallbackAreaId) {
  const name = String(point?.name ?? '').trim();
  const address = String(point?.address ?? '').trim();
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  const areaId = String(point?.areaId ?? fallbackAreaId ?? '').trim();

  if (!name || !address || !Number.isFinite(lat) || !Number.isFinite(lng) || !areaId) {
    return null;
  }

  return { name, address, lat, lng, areaId };
}

function pickAreaPoint({ areas, areaId, snapshot }) {
  const targetAreaId = String(areaId ?? '').trim();
  if (!targetAreaId || !snapshot) {
    return { ok: false, reason: 'missing' };
  }

  const area = (areas || []).find((item) => String(item.areaId) === targetAreaId);
  if (!area) return { ok: false, reason: 'invalid_area' };

  const match = (area.points || []).find((point) => {
    return (
      String(point.name) === snapshot.name &&
      String(point.address) === snapshot.address &&
      Number(point.lat) === snapshot.lat &&
      Number(point.lng) === snapshot.lng
    );
  });

  if (!match) return { ok: false, reason: 'invalid_point' };

  return { ok: true, area, point: match };
}

function normalizeSeatIds(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const seatId of input) {
    const value = String(seatId ?? '').trim();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
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

  const updated = await Promo.findOneAndUpdate(
    query,
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  return Boolean(updated);
}

/**
 * Distributes the total discount across N seats so that the per-seat values
 * sum to exactly the requested discount.
 */
function spreadDiscount(totalDiscount, parts) {
  const safeTotal = Math.max(0, Math.round(Number(totalDiscount) || 0));
  const n = Math.max(0, Math.floor(parts));
  if (n === 0) return [];

  const base = Math.floor(safeTotal / n);
  const remainder = safeTotal - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

module.exports = {
  toInt,
  normalizePoint,
  pickAreaPoint,
  normalizeSeatIds,
  validatePromoCode,
  consumePromo,
  spreadDiscount,
};
