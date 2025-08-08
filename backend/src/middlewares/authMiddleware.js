const { verifyToken: verifyJwt } = require('../utils/tokenUtils');
const { User } = require('../models'); // 🔹 Kullanıcı aktif mi kontrolü için eklendi

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn("❌ Token bulunamadı veya Bearer formatında değil.");
    return res.status(403).json({ message: 'Token bulunamadı' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyJwt(token);

    if (!decoded || !decoded.id) {
      console.warn("❌ Geçersiz token yapısı:", decoded);
      return res.status(401).json({ message: 'Geçersiz token yapısı' });
    }

    // 🔒 Kullanıcı gerçekten aktif mi kontrol et
    const user = await User.findByPk(decoded.id);
    if (!user) {
      console.warn(`❌ Kullanıcı bulunamadı: ID ${decoded.id}`);
      return res.status(403).json({ message: 'Kullanıcı bulunamadı' });
    }
    if (!user.isActive) {
      console.warn(`❌ Kullanıcı pasif: ${user.email}`);
      return res.status(403).json({ message: 'Kullanıcı pasif' });
    }

    // ✅ Kullanıcı bilgilerini request objesine ekle
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    console.log(`🔑 Token doğrulandı → ID: ${user.id}, Role: ${user.role}`);
    next();
  } catch (err) {
    console.error('🔐 Token doğrulama hatası:', err.message);
    return res.status(401).json({ message: 'Token geçersiz' });
  }
  

};

module.exports = verifyToken;
