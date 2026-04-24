const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  googleAuth,
  logout,
  getCurrentUser,
  adminLogin,
  startEmailOtp,
  verifyEmailOtp,
  completeProfile,
  updateAdminProfile,
} = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleAuth
);

// Logout
router.post('/logout', auth, logout);

// Get current user
router.get('/me', auth, getCurrentUser);

// Admin login (email/password)
router.post('/admin/login', adminLogin);
router.patch('/admin/profile', auth, updateAdminProfile);

// Mobile email + OTP flow
router.post('/email/start', startEmailOtp);
router.post('/email/verify', verifyEmailOtp);
router.post('/email/complete', auth, completeProfile);

module.exports = router;
