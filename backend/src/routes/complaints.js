const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const {
  createComplaint,
  listMyComplaints,
  adminListComplaints,
  updateComplaint,
} = require('../controllers/complaintController');

router.use(auth);

router.get('/me', listMyComplaints);
router.post('/', createComplaint);

router.get('/admin/list', requireRole('admin', 'staff'), adminListComplaints);
router.patch('/admin/:id', requireRole('admin', 'staff'), updateComplaint);

module.exports = router;
