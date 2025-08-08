const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const authService = require('../services/authService');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar';

// 📌 Kayıt işlemi
const register = async (req, res) => {
  try {
    console.log('🟢 Register request body:', req.body);

    // 🔍 Kullanıcı adı veya e-posta kontrolü
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: req.body.username },
          { email: req.body.email }
        ]
      }
    });
if (existingUser) {
  return res.status(400).json({
    success: false,
    message:
      existingUser.username === req.body.username
        ? 'Bu kullanıcı adı zaten alınmış.'
        : 'Bu e-posta adresi zaten kayıtlı.'
  });
}


    // 🛡️ Varsayılan rol
    if (!req.body.role) {
      req.body.role = 'user';
    }

    const user = await authService.registerUser(req.body);
    console.log('🟢 Yeni kullanıcı:', user);

    res.status(201).json({
      message: 'Kayıt başarılı',
      user
    });
  } catch (err) {
    console.error('❌ Kayıt hatası:', err, err.stack);

    // Sequelize unique constraint hatası yakalama
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Bu kullanıcı adı veya e-posta zaten kayıtlı.' });
    }

    res.status(500).json({ error: err.message });
  }
};

// 📌 Giriş işlemi
const login = async (req, res) => {
  try {
    console.log('Login çağrıldı, body:', req.body);
    const { identity, password } = req.body;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity || "");
    const email = isEmail ? identity : undefined;
    const username = !isEmail ? identity : undefined;

    const result = await authService.loginUser({ email, username, password });

    if (result.error) {
      const status = result.error === "Geçersiz şifre" ? 401 : 404;
      return res.status(status).json({ message: result.error });
    }

    const user = result.user;

    if (!user.isActive) {
      console.warn(`⛔ Pasif kullanıcı giriş denemesi: ${user.email}`);
      return res.status(403).json({ message: "Kullanıcı aktif değil" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error('❌ Login hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

// 📌 Token doğrulama sonrası kullanıcı bilgilerini getirme
const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'fullname', 'email', 'role', 'isActive', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json(user);
  } catch (err) {
    console.error('❌ getMe hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getMe };
