const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const {
  listUsers,
  updateUserRole,
  listAdminNotifications,
  listDrivers,
  promoteUserToDriver,
  demoteDriver,
} = require('../controllers/adminController');

router.use(auth, requireRole('admin', 'staff'));

router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);

router.get('/drivers', listDrivers);
router.post('/drivers/:id/promote', promoteUserToDriver);
router.post('/drivers/:id/demote', demoteDriver);

router.get('/notifications', listAdminNotifications);

module.exports = router;

