const Complaint = require('../models/Complaint');
const { createAdminLog } = require('../utils/adminAudit');

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

exports.createComplaint = async (req, res) => {
  try {
    const { ticketId, tripId, subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ msg: 'subject and message are required' });

    const complaint = await Complaint.create({
      userId: req.user.id,
      ticketId: ticketId ?? null,
      tripId: tripId ?? null,
      subject,
      message,
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listMyComplaints = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    const [items, total] = await Promise.all([
      Complaint.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Complaint.countDocuments(query),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.adminListComplaints = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = String(req.query.status);

    const [items, total] = await Promise.all([
      Complaint.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email phone role')
        .populate('tripId')
        .populate('ticketId'),
      Complaint.countDocuments(query),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const patch = {};
    const allowed = ['status', 'resolutionNote'];
    for (const key of allowed) {
      if (typeof req.body[key] !== 'undefined') patch[key] = req.body[key];
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, patch, { new: true })
      .populate('userId', 'name email phone role')
      .populate('tripId')
      .populate('ticketId');

    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

    if (req.user?.id) {
      await createAdminLog({
        adminUserId: req.user.id,
        action: 'update',
        entityType: 'complaint',
        entityId: complaint.id,
        details: `Updated complaint ${complaint.id}`,
        metadata: patch,
      });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};
