const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { hasMailerConfig, sendOtpEmail } = require('../config/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

function isAllowedRedirectUrl(rawUrl) {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl);
    const allowedOrigins = [
      process.env.MOBILE_APP_URL,
      process.env.WEBADMIN_URL,
      process.env.WEB_URL,
    ].filter(Boolean);
    if (allowedOrigins.length === 0) return false;
    return allowedOrigins.some((origin) => {
      try {
        const o = new URL(origin);
        return url.origin === o.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

// Google OAuth Callback
exports.googleAuth = (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ msg: 'Authentication failed' });
    
    // Tạo JWT token
    const payload = { user: { id: user.id, role: user.role || 'user' } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    // Redirect về mobile app với token (hoặc return JSON)
    const requestedRedirect = req.query.redirect;
    const base =
      (isAllowedRedirectUrl(requestedRedirect) && requestedRedirect) ||
      process.env.MOBILE_APP_URL ||
      'http://localhost:3000';

    const url = new URL(base);
    url.searchParams.set('token', token);
    url.searchParams.set('userId', user.id);
    url.searchParams.set('role', user.role || 'user');

    res.redirect(url.toString());
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Logout
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ msg: 'Logout failed' });
    res.json({ msg: 'Logged out successfully' });
  });
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Admin email/password login (single admin account)
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount !== 1) {
      return res.status(403).json({ msg: 'Admin access is not configured' });
    }

    const user = await User.findOne({ email: normalizedEmail, role: 'admin' }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ msg: 'Invalid credentials' });

    const payload = { user: { id: user.id, role: 'admin' } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar ?? null,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isOtpExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

// Step 1: email -> check exists -> generate OTP
exports.startEmailOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    // Only allow user/driver (not admin) via mobile flow
    let user = await User.findOne({ email });
    const isNew = !user;

    if (user && user.role === 'admin') {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    if (!user) {
      user = new User({ email, name: '', role: 'user' });
    }

    const otp = generateOtp();
    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    // Send OTP via Gmail SMTP (real email)
    try {
      await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error('sendOtpEmail error', mailErr);
      return res.status(500).json({
        msg: hasMailerConfig()
          ? 'Failed to send OTP email'
          : 'Mailer is not configured',
      });
    }

    res.json({
      isNew,
      otpSent: true,
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
    });
  } catch (err) {
    console.error('startEmailOtp error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Step 2: email + otp -> verify -> old user gets JWT, new user gets onboarding JWT
exports.verifyEmailOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || '').trim();
    if (!email || !otp) return res.status(400).json({ msg: 'Email and otp are required' });

    const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt');
    if (!user) return res.status(401).json({ msg: 'Invalid OTP' });
    if (user.role === 'admin') return res.status(403).json({ msg: 'Forbidden' });
    if (!user.otpHash || isOtpExpired(user.otpExpiresAt)) {
      return res.status(401).json({ msg: 'OTP expired' });
    }

    const ok = await bcrypt.compare(otp, user.otpHash);
    if (!ok) return res.status(401).json({ msg: 'Invalid OTP' });

    // clear OTP
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();

    const needsProfile = !user.name || !user.phone;
    const payload = {
      user: { id: user.id, role: user.role || 'user', onboarding: needsProfile },
    };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: needsProfile ? '15m' : '7d',
    });

    res.json({
      isNew: needsProfile,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('verifyEmailOtp error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Step 3: onboarding token -> complete profile (name + phone) -> return full JWT
exports.completeProfile = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ msg: 'Unauthorized' });

    const { name, phone } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanPhone = String(phone || '').trim();
    if (!cleanName || !cleanPhone) {
      return res.status(400).json({ msg: 'Name and phone are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ msg: 'Forbidden' });

    user.name = cleanName;
    user.phone = cleanPhone;
    await user.save();

    const payload = { user: { id: user.id, role: user.role || 'user' } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('completeProfile error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
