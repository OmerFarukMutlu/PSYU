const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    console.log("🎯 checkRole çalıştı, requiredRoles:", requiredRoles, "userRole:", req.user?.role);

    if (!req.user) {
      console.warn("❌ Yetkisiz erişim: kullanıcı bulunamadı");
      return res.status(403).json({ message: 'Yetkisiz erişim: kullanıcı bulunamadı' });
    }

    // Tek rol string olarak gelirse diziye çevir
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }

    if (!requiredRoles.includes(req.user.role)) {
      console.warn(`❌ Yetkisiz erişim: rol uygun değil (${req.user.role})`);
      return res.status(403).json({ message: 'Yetkisiz erişim: rol uygun değil' });
    }

    next();
  };
};

module.exports = checkRole;
