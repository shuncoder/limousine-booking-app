const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const {
  listUsers,
  updateUserRole,
  listRides,
  updateRide,
  listAdminNotifications,
} = require('../controllers/adminController');

router.use(auth, requireRole('admin', 'staff'));

router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);

router.get('/rides', listRides);
router.patch('/rides/:id', updateRide);
router.get('/notifications', listAdminNotifications);

module.exports = router;

