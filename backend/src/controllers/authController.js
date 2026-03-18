const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Xác thực Firebase token
const admin = require('firebase-admin');

exports.verifyPhone = async (req, res) => {
  const { firebaseToken } = req.body;
  try {
    // Xác thực token từ Firebase
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const phoneNumber = decoded.phone_number;
    if (!phoneNumber) return res.status(400).json({ msg: 'Invalid phone number' });

    let user = await User.findOne({ phone: phoneNumber });
    if (!user) {
      // User mới, yêu cầu nhập tên
      return res.status(200).json({ isNew: true });
    }
    // User đã tồn tại, trả về token
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ msg: 'Firebase token invalid' });
  }
};

exports.register = async (req, res) => {
  const { firebaseToken, name } = req.body;
  try {
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const phoneNumber = decoded.phone_number;
    if (!phoneNumber) return res.status(400).json({ msg: 'Invalid phone number' });

    let user = await User.findOne({ phone: phoneNumber });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    user = new User({ name, phone: phoneNumber });
    await user.save();
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).send('Server error');
  }
};
