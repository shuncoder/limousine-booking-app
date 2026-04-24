const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema(
  {
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, default: null, trim: true },
    details: { type: String, default: '', trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
