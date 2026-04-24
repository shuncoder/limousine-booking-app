const mongoose = require('mongoose');

function buildSeatLayout({ rowCount = 10, leftCount = 2, rightCount = 2 } = {}) {
  const rows = [];
  let seatNumber = 1;

  for (let r = 0; r < rowCount; r += 1) {
    const row = [];

    for (let i = 0; i < leftCount; i += 1) row.push(String(seatNumber++));

    row.push(null); // aisle

    for (let i = 0; i < rightCount; i += 1) row.push(String(seatNumber++));

    rows.push(row);
  }

  return { rows, meta: { rowCount, leftCount, rightCount } };
}

function extractSeatIds(seatLayout) {
  const ids = [];
  for (const row of seatLayout?.rows ?? []) {
    for (const cell of row) {
      if (cell) ids.push(String(cell));
    }
  }
  return ids;
}

const dynamicPricingTierSchema = new mongoose.Schema(
  {
    minFillRate: { type: Number, min: 0, max: 1, required: true },
    multiplier: { type: Number, min: 0, required: true },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    routeFrom: { type: String, required: true, trim: true },
    routeTo: { type: String, required: true, trim: true },
    departureAt: { type: Date, required: true },

    vehicleName: { type: String, default: null, trim: true },

    seatLayout: { type: Object, required: true },
    seatIds: { type: [String], default: [] },
    totalSeats: { type: Number, default: 0 },

    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'VND' },

    dynamicPricing: {
      enabled: { type: Boolean, default: false },
      tiers: { type: [dynamicPricingTierSchema], default: [] },
    },

    status: {
      type: String,
      enum: ['scheduled', 'departed', 'cancelled'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

tripSchema.pre('validate', function syncSeatMetadata(next) {
  if (!this.seatLayout) {
    this.seatLayout = buildSeatLayout();
  }

  const seatIds = extractSeatIds(this.seatLayout);
  this.seatIds = seatIds;
  this.totalSeats = seatIds.length;
  next();
});

tripSchema.statics.buildSeatLayout = buildSeatLayout;
tripSchema.statics.extractSeatIds = extractSeatIds;

tripSchema.index({ departureAt: 1 });
tripSchema.index({ routeFrom: 1, routeTo: 1, departureAt: 1 });

module.exports = mongoose.model('Trip', tripSchema);
