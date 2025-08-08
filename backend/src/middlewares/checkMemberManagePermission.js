// Sadece admin, admin_helper ve project_manager rollerine izin verir
module.exports = (req, res, next) => {
  const allowedRoles = ['admin', 'admin_helper', 'project_manager'];

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
  }

  next();
};
