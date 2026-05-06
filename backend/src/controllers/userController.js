const User = require('../models/User');

function isValidPhone(phone) {
  return /^[0-9+\-\s]{8,15}$/.test(String(phone || '').trim());
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';

    if (name && name.length < 2) {
      return res.status(400).json({ msg: 'Tên phải có ít nhất 2 ký tự' });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ msg: 'Số điện thoại không hợp lệ' });
    }

    const update = {};
    if (name) update.name = name;
    if (phone) update.phone = phone;

    if (!Object.keys(update).length) {
      return res.status(400).json({ msg: 'Không có dữ liệu để cập nhật' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).send('Server error');
  }
};
