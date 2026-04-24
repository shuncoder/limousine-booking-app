const Promo = require('../models/Promo');
const { createAdminLog } = require('../utils/adminAudit');

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

exports.listPromos = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const query = {};
    if (typeof req.query.active !== 'undefined') query.active = String(req.query.active) === 'true';

    const [items, total] = await Promise.all([
      Promo.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Promo.countDocuments(query),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.createPromo = async (req, res) => {
  try {
    const { code, type, value, active, startsAt, endsAt, maxUses } = req.body;
    if (!code || !type) return res.status(400).json({ msg: 'code and type are required' });

    const promo = await Promo.create({
      code,
      type,
      value,
      active: typeof active === 'boolean' ? active : true,
      startsAt: startsAt ?? null,
      endsAt: endsAt ?? null,
      maxUses: maxUses ?? null,
    });

    if (req.user?.id) {
      await createAdminLog({
        adminUserId: req.user.id,
        action: 'create',
        entityType: 'promo',
        entityId: promo.id,
        details: `Created promo ${promo.code}`,
      });
    }

    res.status(201).json(promo);
  } catch (err) {
    if (String(err?.code) === '11000') {
      return res.status(409).json({ msg: 'Promo code already exists' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updatePromo = async (req, res) => {
  try {
    const patch = {};
    const allowed = ['type', 'value', 'active', 'startsAt', 'endsAt', 'maxUses'];
    for (const key of allowed) {
      if (typeof req.body[key] !== 'undefined') patch[key] = req.body[key];
    }

    const promo = await Promo.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!promo) return res.status(404).json({ msg: 'Promo not found' });

    if (req.user?.id) {
      await createAdminLog({
        adminUserId: req.user.id,
        action: 'update',
        entityType: 'promo',
        entityId: promo.id,
        details: `Updated promo ${promo.code}`,
        metadata: patch,
      });
    }

    res.json(promo);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deletePromo = async (req, res) => {
  try {
    const promo = await Promo.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ msg: 'Promo not found' });

    if (req.user?.id) {
      await createAdminLog({
        adminUserId: req.user.id,
        action: 'delete',
        entityType: 'promo',
        entityId: req.params.id,
        details: `Deleted promo ${promo.code}`,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.validatePromo = async (req, res) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ msg: 'code is required' });

    const promo = await Promo.findOne({ code, active: true });
    if (!promo) return res.status(404).json({ msg: 'Promo not found' });

    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) return res.status(400).json({ msg: 'Promo not started' });
    if (promo.endsAt && promo.endsAt < now) return res.status(400).json({ msg: 'Promo expired' });
    if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return res.status(400).json({ msg: 'Promo max uses reached' });

    res.json({ ok: true, promo });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
