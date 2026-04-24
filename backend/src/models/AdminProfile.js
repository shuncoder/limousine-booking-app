const mongoose = require('mongoose');

const adminProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminProfile', adminProfileSchema);
