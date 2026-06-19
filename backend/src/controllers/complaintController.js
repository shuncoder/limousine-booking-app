const Complaint = require('../models/Complaint');
const ComplaintStatusHistory = require('../models/ComplaintStatusHistory');
const { createAdminLog } = require('../utils/adminAudit');
const { createNotification } = require('../utils/notify');

const STATUS_LABELS = {
  open: 'Mới',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
  rejected: 'Từ chối',
};

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

async function logComplaintStatusHistory({
  complaintId,
  userId,
  status,
  previousStatus = null,
  resolutionNote = null,
  changedBy = null,
  changedByRole = 'system',
  note = '',
}) {
  return ComplaintStatusHistory.create({
    complaintId,
    userId,
    status,
    previousStatus,
    resolutionNote,
    changedBy,
    changedByRole,
    note,
  });
}

async function getComplaintHistory(complaintId) {
  return ComplaintStatusHistory.find({ complaintId })
    .sort({ createdAt: 1 })
    .populate('changedBy', 'name email role');
}

function buildStatusNotificationBody(status, resolutionNote) {
  const label = STATUS_LABELS[status] || status;
  if (resolutionNote) {
    return `Trạng thái: ${label}. Ghi chú: ${resolutionNote}`;
  }
  return `Trạng thái khiếu nại đã được cập nhật thành: ${label}.`;
}

exports.createComplaint = async (req, res) => {
  try {
    const { ticketId, tripId, subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ msg: 'subject and message are required' });

    const now = new Date();
    const complaint = await Complaint.create({
      userId: req.user.id,
      ticketId: ticketId ?? null,
      tripId: tripId ?? null,
      subject,
      message,
      statusUpdatedAt: now,
    });

    await logComplaintStatusHistory({
      complaintId: complaint._id,
      userId: req.user.id,
      status: 'open',
      previousStatus: null,
      changedBy: req.user.id,
      changedByRole: req.user.role || 'user',
      note: 'Khiếu nại đã được gửi',
    });

    res.status(201).json(complaint);
  } catch (err) {
    console.error('createComplaint error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listMyComplaints = async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query.limit, 20)));
    const skip = (page - 1) * limit;

    const query = { userId: req.user.id };
    if (req.query.status) query.status = String(req.query.status);

    const [items, total] = await Promise.all([
      Complaint.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('tripId', 'routeFrom routeTo departureAt')
        .populate('ticketId', 'seatId status'),
      Complaint.countDocuments(query),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    console.error('listMyComplaints error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getMyComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .populate('tripId', 'routeFrom routeTo departureAt')
      .populate('ticketId', 'seatId status totalAmount');

    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

    const history = await getComplaintHistory(complaint._id);

    res.json({ complaint, history });
  } catch (err) {
    console.error('getMyComplaint error', err);
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
    console.error('adminListComplaints error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const existing = await Complaint.findById(req.params.id);
    if (!existing) return res.status(404).json({ msg: 'Complaint not found' });

    const patch = {};
    const allowed = ['status', 'resolutionNote'];
    for (const key of allowed) {
      if (typeof req.body[key] !== 'undefined') patch[key] = req.body[key];
    }

    const statusChanged =
      typeof patch.status !== 'undefined' && patch.status !== existing.status;
    const resolutionChanged =
      typeof patch.resolutionNote !== 'undefined' &&
      patch.resolutionNote !== existing.resolutionNote;

    if (statusChanged || resolutionChanged) {
      patch.statusUpdatedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, patch, { new: true })
      .populate('userId', 'name email phone role')
      .populate('tripId')
      .populate('ticketId');

    if (statusChanged || resolutionChanged) {
      const newStatus = complaint.status;
      const note = statusChanged
        ? `Admin cập nhật trạng thái: ${STATUS_LABELS[newStatus] || newStatus}`
        : 'Admin cập nhật ghi chú xử lý';

      await logComplaintStatusHistory({
        complaintId: complaint._id,
        userId: complaint.userId._id || complaint.userId,
        status: newStatus,
        previousStatus: statusChanged ? existing.status : existing.status,
        resolutionNote: complaint.resolutionNote,
        changedBy: req.user.id,
        changedByRole: req.user.role || 'admin',
        note,
      });

      const ownerId = complaint.userId._id || complaint.userId;
      await createNotification({
        userId: ownerId,
        type: 'complaint_status_updated',
        title: 'Cập nhật khiếu nại',
        body: buildStatusNotificationBody(newStatus, complaint.resolutionNote),
        tripId: complaint.tripId?._id || complaint.tripId || null,
        ticketId: complaint.ticketId?._id || complaint.ticketId || null,
        metadata: {
          complaintId: String(complaint._id),
          status: newStatus,
          previousStatus: existing.status,
        },
      });
    }

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
    console.error('updateComplaint error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.adminGetComplaintHistory = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).select('_id subject status');
    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });

    const history = await getComplaintHistory(complaint._id);
    res.json({ complaint, history });
  } catch (err) {
    console.error('adminGetComplaintHistory error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
