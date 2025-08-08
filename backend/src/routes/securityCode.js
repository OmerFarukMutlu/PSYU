const express = require('express');
const router = express.Router();
const { SecurityCode } = require('../models');
const verifyToken = require('../middlewares/authMiddleware');

/**
 * @route POST /api/security-code
 * @desc Güvenlik kodu oluşturma/güncelleme (hashsiz)
 */
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('📥 Güvenlik kodu POST isteği geldi');
    console.log('🔹 Token user:', req.user);
    console.log('🔹 Body:', req.body);

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Güvenlik kodu gerekli' });
    }

    const existing = await SecurityCode.findOne({ where: { userId: req.user.id } });

    if (existing) {
      console.log('🔄 Mevcut kod güncelleniyor...');
      existing.code = code;
      await existing.save();
      return res.json({ success: true, message: 'Güvenlik kodu güncellendi', code: existing.code });
    }

    console.log('🆕 Yeni kod oluşturuluyor...');
    const newCode = await SecurityCode.create({
      userId: req.user.id,
      code
    });

    res.json({ success: true, message: 'Güvenlik kodu kaydedildi', code: newCode.code });
  } catch (err) {
    console.error('❌ Güvenlik kodu ekleme hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});


/**
 * @route GET /api/security-code
 * @desc Kullanıcının mevcut güvenlik kodunu getir
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('📩 [GET] /api/security-code userId:', req.user.id);

    const codeData = await SecurityCode.findOne({
      where: { userId: req.user.id }
    });

    if (!codeData) {
      console.log('⚠️ Güvenlik kodu bulunamadı');
      return res
        .status(404)
        .json({ success: false, message: 'Güvenlik kodu bulunamadı' });
    }

    console.log('✅ Güvenlik kodu bulundu:', codeData.code);
    res.json({ success: true, code: codeData.code });
  } catch (err) {
    console.error('❌ Güvenlik kodu getirme hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

module.exports = router;
