const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const {
  revenueByRoute,
  revenueOverTime,
  fillRate,
  analyzeRevenueWithAi,
} = require('../controllers/reportController');

router.use(auth, requireRole('admin', 'staff'));

router.get('/revenue-by-route', revenueByRoute);
router.get('/revenue-over-time', revenueOverTime);
router.post('/analyze-revenue-ai', analyzeRevenueWithAi);
router.get('/fill-rate', fillRate);

module.exports = router;
