//rest parameters: ...allowedRoles gom nhiều đối số (arguments) thành một mảng
module.exports = function requireRole(...allowedRoles) {
  return function (req, res, next) {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ msg: 'Không có quyền truy cập' });
    }
    next();
  };
};

