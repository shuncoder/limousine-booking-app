module.exports = function requireRole(...allowedRoles) {
  return function (req, res, next) {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    next();
  };
};

