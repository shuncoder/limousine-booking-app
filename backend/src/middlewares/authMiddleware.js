const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev-jwt-secret';
    const decoded = jwt.verify(token, secret);

    if (!decoded.user || !decoded.user.id) {
      return res.status(401).json({ msg: 'Invalid token structure' });
    }
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message); 
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};