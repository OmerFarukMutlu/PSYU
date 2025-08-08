const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const commentController = require('../controllers/commentController');

// 🔓 Kullanıcının kendi yorumları
router.get('/my', verifyToken, commentController.getMyComments);

module.exports = router;
