const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const {
  createTicket,
  createBatchTickets,
  payTicket,
  cancelTicket,
  requestRefund,
  approveRefund,
  listMyTickets,
  adminListTickets,
  getTicketRoutePlan,
  quoteTrip,
} = require('../controllers/ticketController');

router.use(auth);

router.get('/me', listMyTickets);
router.post('/quote/:id', quoteTrip);
router.post('/', createTicket);
router.post('/batch', createBatchTickets);
router.post('/:id/pay', payTicket);
router.post('/:id/cancel', cancelTicket);
router.post('/:id/refund', requestRefund);
router.get('/:id/route-plan', getTicketRoutePlan);

router.get('/admin/list', requireRole('admin', 'staff'), adminListTickets);
router.post('/admin/:id/refund/approve', requireRole('admin', 'staff'), approveRefund);

module.exports = router;
