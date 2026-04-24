const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },

    active: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },

    maxUses: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

promoSchema.index({ active: 1, code: 1 });

module.exports = mongoose.model('Promo', promoSchema);
