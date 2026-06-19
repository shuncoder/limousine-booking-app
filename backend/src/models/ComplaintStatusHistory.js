const mongoose = require('mongoose');

const complaintStatusHistorySchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'rejected'],
      required: true,
    },
    previousStatus: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'rejected'],
      default: null,
    },
    resolutionNote: { type: String, default: null },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changedByRole: {
      type: String,
      enum: ['user', 'admin', 'staff', 'system'],
      default: 'system',
    },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

complaintStatusHistorySchema.index({ complaintId: 1, createdAt: 1 });

module.exports = mongoose.model('ComplaintStatusHistory', complaintStatusHistorySchema);
