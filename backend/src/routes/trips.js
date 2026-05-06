const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const {
  createTrip,
  listTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  getTripSeats,
  getTripPricePreview,
  listMyDriverTrips,
  listTripPassengers,
} = require('../controllers/tripController');

const { holdSeat, releaseSeat } = require('../controllers/seatHoldController');

router.use(auth);

router.get('/', listTrips);
router.post('/', requireRole('admin', 'staff'), createTrip);

router.get('/driver/me', requireRole('driver'), listMyDriverTrips);

router.get('/:id', getTrip);
router.patch('/:id', requireRole('admin', 'staff'), updateTrip);
router.delete('/:id', requireRole('admin', 'staff'), deleteTrip);

router.get('/:id/seats', getTripSeats);
router.get('/:id/price', getTripPricePreview);
router.get('/:id/passengers', listTripPassengers);

router.post('/:id/hold', holdSeat);
router.delete('/:id/hold/:seatId', releaseSeat);

module.exports = router;
