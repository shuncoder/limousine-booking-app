const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null, index: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null, index: true },

    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'rejected'], default: 'open', index: true },
    resolutionNote: { type: String, default: null },
  },
  { timestamps: true }
);

complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
