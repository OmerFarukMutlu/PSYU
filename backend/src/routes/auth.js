const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');

// 📌 Kullanıcı kayıt
router.post('/register', register);

// 📌 Kullanıcı giriş
router.post('/login', login);

// 📌 Giriş yapan kullanıcının bilgileri (role dahil)
router.get('/me', authenticate, getMe);

module.exports = router;
