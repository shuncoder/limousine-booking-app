const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const {
  listUsers,
  updateUserRole,
  listRides,
  updateRide,
} = require('../controllers/adminController');

router.use(auth, requireRole('admin'));

router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);

router.get('/rides', listRides);
router.patch('/rides/:id', updateRide);

module.exports = router;

