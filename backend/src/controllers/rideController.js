const Ride = require('../models/Ride');

exports.bookRide = async (req, res) => {
  const { pickupLocation, dropoffLocation } = req.body;
  try {
    const ride = new Ride({
      userId: req.user.id,
      pickupLocation,
      dropoffLocation
    });
    await ride.save();
    res.json(ride);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getRideHistory = async (req, res) => {
  try {
    const rides = await Ride.find({ userId: req.user.id });
    res.json(rides);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    res.status(500).send('Server error');
  }
};
