const express = require('express');
const router = express.Router();
const { User, SecurityCode } = require('../models');
const bcrypt = require('bcrypt');
// routes/resetPassword.js içinde
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'E-posta ve güvenlik kodu gerekli' });
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' }); // ✅ net mesaj
    }

    // Güvenlik kodunu bul
    const secCode = await SecurityCode.findOne({ where: { userId: user.id } });
    if (!secCode) {
      return res.status(400).json({ message: 'Güvenlik kodu bulunamadı' }); // ✅ net mesaj
    }

    // Kod eşleşmiyorsa
    if (secCode.code !== code) {
      return res.status(400).json({ message: 'Güvenlik kodu hatalı' }); // ✅ net mesaj
    }

    // Başarılı ise
    res.json({ message: 'Kod doğrulandı', userId: user.id });
  } catch (err) {
    console.error('Kod doğrulama hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});



// 2️⃣ Yeni şifre belirleme
router.post('/set-new-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'Kullanıcı ID ve yeni şifre gerekli' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('Şifre güncelleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
