const mongoose = require('mongoose');

const seatHoldSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    seatId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

seatHoldSchema.index({ tripId: 1, seatId: 1 }, { unique: true });
seatHoldSchema.index({ tripId: 1, userId: 1 });

module.exports = mongoose.model('SeatHold', seatHoldSchema);
