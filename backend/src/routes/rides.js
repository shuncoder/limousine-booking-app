const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { bookRide, getRideHistory, getRideById } = require('../controllers/rideController');

router.post('/book', auth, bookRide);
router.get('/history', auth, getRideHistory);
router.get('/:id', auth, getRideById);

module.exports = router;
