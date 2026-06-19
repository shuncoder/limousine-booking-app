const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ticket_created',
        'ticket_paid',
        'ticket_cancelled',
        'ticket_expired',
        'driver_new_passenger',
        'complaint_status_updated',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },

    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },

    metadata: { type: mongoose.Schema.Types.Mixed, default: null },

    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
