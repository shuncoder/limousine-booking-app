const User = require('../models/User');
const Ride = require('../models/Ride');
const AdminNotification = require('../models/AdminNotification');
const { createAdminLog } = require('../utils/adminAudit');

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-googleId'),
      User.countDocuments({}),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['user', 'driver', 'staff', 'admin'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }

    const before = await User.findById(req.params.id).select('-googleId');
    if (!before) return res.status(404).json({ msg: 'User not found' });

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-googleId');

    await createAdminLog({
      adminUserId: req.user.id,
      action: 'update',
      entityType: 'user_role',
      entityId: user.id,
      details: `Changed role of ${user.email} from ${before.role} to ${role}`,
      metadata: { fromRole: before.role, toRole: role },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listRides = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const [items, total] = await Promise.all([
      Ride.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email phone role avatar')
        .populate('driverId', 'name email phone role avatar'),
      Ride.countDocuments(query),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateRide = async (req, res) => {
  try {
    const { status, driverId } = req.body;
    const patch = {};

    if (typeof status !== 'undefined') {
      const allowed = ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ msg: 'Invalid status' });
      }
      patch.status = status;
    }

    if (typeof driverId !== 'undefined') {
      patch.driverId = driverId || null;
    }

    const ride = await Ride.findByIdAndUpdate(req.params.id, patch, { new: true })
      .populate('userId', 'name email phone role avatar')
      .populate('driverId', 'name email phone role avatar');

    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    await createAdminLog({
      adminUserId: req.user.id,
      action: 'update',
      entityType: 'ride',
      entityId: ride.id,
      details: `Updated ride ${ride.id}`,
      metadata: patch,
    });

    res.json(ride);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listAdminNotifications = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AdminNotification.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('adminUserId', 'username email role'),
      AdminNotification.countDocuments({}),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

