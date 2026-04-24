const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const {
  listPromos,
  createPromo,
  updatePromo,
  deletePromo,
  validatePromo,
} = require('../controllers/promoController');

router.use(auth);

router.get('/validate', validatePromo);

router.get('/', requireRole('admin', 'staff'), listPromos);
router.post('/', requireRole('admin', 'staff'), createPromo);
router.patch('/:id', requireRole('admin', 'staff'), updatePromo);
router.delete('/:id', requireRole('admin', 'staff'), deletePromo);

module.exports = router;
