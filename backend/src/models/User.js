const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, default: null, select: false },
  phone: { type: String, default: null },
  googleId: { type: String, default: null },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
  otpHash: { type: String, default: null, select: false },
  otpExpiresAt: { type: Date, default: null, select: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
