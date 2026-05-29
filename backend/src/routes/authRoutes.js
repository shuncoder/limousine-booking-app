const express = require('express');
const router = express.Router();
const {
  logout,
  getCurrentUser,
  adminLogin,
  startEmailOtp,
  verifyEmailOtp,
  completeProfile,
  updateAdminProfile,
} = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');

router.post('/logout', auth, logout);

router.get('/me', auth, getCurrentUser);

router.post('/admin/login', adminLogin);
router.patch('/admin/profile', auth, updateAdminProfile);

router.post('/email/start', startEmailOtp);
router.post('/email/verify', verifyEmailOtp);
router.post('/email/complete', auth, completeProfile);

module.exports = router;
