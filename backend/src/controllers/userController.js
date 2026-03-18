exports.getProfile = async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
};
