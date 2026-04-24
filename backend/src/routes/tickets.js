const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const {
  createTicket,
  payTicket,
  cancelTicket,
  requestRefund,
  approveRefund,
  listMyTickets,
  adminListTickets,
} = require('../controllers/ticketController');

router.use(auth);

router.get('/me', listMyTickets);
router.post('/', createTicket);
router.post('/:id/pay', payTicket);
router.post('/:id/cancel', cancelTicket);
router.post('/:id/refund', requestRefund);

router.get('/admin/list', requireRole('admin', 'staff'), adminListTickets);
router.post('/admin/:id/refund/approve', requireRole('admin', 'staff'), approveRefund);

module.exports = router;
