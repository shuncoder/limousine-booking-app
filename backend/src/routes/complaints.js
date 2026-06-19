const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const {
  createComplaint,
  listMyComplaints,
  getMyComplaint,
  adminListComplaints,
  updateComplaint,
  adminGetComplaintHistory,
} = require('../controllers/complaintController');

router.use(auth);

router.get('/me', listMyComplaints);
router.get('/me/:id', getMyComplaint);
router.post('/', createComplaint);

router.get('/admin/list', requireRole('admin', 'staff'), adminListComplaints);
router.get('/admin/:id/history', requireRole('admin', 'staff'), adminGetComplaintHistory);
router.patch('/admin/:id', requireRole('admin', 'staff'), updateComplaint);

module.exports = router;
