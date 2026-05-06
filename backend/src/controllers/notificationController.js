const Notification = require('../models/Notification');

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

exports.listMyNotifications = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 30)));
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    if (req.query.unread === 'true') query.readAt = null;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user.id, readAt: null }),
    ]);

    res.json({ items, page, limit, total, unreadCount });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      readAt: null,
    });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { readAt: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ msg: 'Notification not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const now = new Date();
    const result = await Notification.updateMany(
      { userId: req.user.id, readAt: null },
      { readAt: now }
    );
    res.json({ ok: true, modified: result.modifiedCount || 0 });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
