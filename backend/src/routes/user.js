const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const userController = require('../controllers/userController');

// ✅ Admin & admin_helper için kullanıcı yönetimi listesi
router.get(
  '/admin-panel',
  verifyToken,
  checkRole(['admin', 'admin_helper']),
  userController.getAllUsers
);

// ✅ Frontend'teki /api/users isteği → proje üyesi ekleme yetkisi olan roller için
router.get(
  '/',
  verifyToken,
  checkRole(['admin', 'admin_helper', 'project_manager', 'team_lead']),
  userController.getAllUsers
);

// ✅ Admin & admin_helper yeni kullanıcı ekleyebilir
router.post(
  '/',
  verifyToken,
  checkRole(['admin', 'admin_helper']),
  userController.createUserByAdmin
);

// 🔒 Giriş yapmış herkes kendi bilgilerini görebilir
router.get('/me', verifyToken, userController.getMyProfile);

// 🔍 İsimle kullanıcı arama
router.get('/search/by-name', verifyToken, userController.searchUsers);

// 🔓 Tüm kullanıcıları listele (proje üyeliği için kullanılabilir)
router.get('/public', verifyToken, userController.listAllUsers);

// 🔒 Admin kullanıcılar başka kullanıcıları görebilir
router.get('/:id', verifyToken, checkRole('admin'), userController.getUserById);

// 🔒 Admin & admin_helper rol değiştirebilir
router.patch(
  '/:id/role',
  verifyToken,
  checkRole(['admin', 'admin_helper']),
  userController.updateUserRole
);

// 🔒 Admin kullanıcılar aktif/pasif yapabilir
router.patch(
  '/:id/activate',
  verifyToken,
  checkRole('admin'),
  userController.updateActiveStatus
);

// ✏️ Admin & admin_helper kullanıcı bilgilerini güncelleyebilir
router.put(
  '/:id',
  verifyToken,
  checkRole(['admin', 'admin_helper']),
  userController.updateUser
);

// 🗑️ Admin & admin_helper kullanıcı silebilir
router.delete(
  '/:id',
  verifyToken,
  checkRole(['admin', 'admin_helper']),
  userController.deleteUser
);

module.exports = router;
