const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    seatId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },

    priceBeforeDiscount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'VND' },

    promoCode: { type: String, default: null },

    expiresAt: { type: Date, default: null, index: true },
    paidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    expiredAt: { type: Date, default: null },

    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'refunded'],
      default: 'none',
      index: true,
    },
    refundRequestedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },
  },
  { timestamps: true }
);

// Prevent double-booking for active tickets (pending/paid)
// Note: partial index requires MongoDB support (works on Atlas/local Mongo).
ticketSchema.index(
  { tripId: 1, seatId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'paid'] } } }
);

ticketSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
