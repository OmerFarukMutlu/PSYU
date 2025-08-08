const express = require('express');
const router = express.Router({ mergeParams: true });

const verifyToken = require('../middlewares/authMiddleware');
const checkMemberManagePermission = require('../middlewares/checkMemberManagePermission');
const projectMemberController = require('../controllers/projectMemberController');

// ✅ Projeye yeni üye ekle (sadece yetkililer)
router.post(
  '/:projectId/members',
  verifyToken,
  checkMemberManagePermission,
  projectMemberController.addMember
);

// ✅ Projedeki üyeleri getir (herkes görebilir)
router.get(
  '/:projectId/members',
  verifyToken,
  projectMemberController.listMembers
);

// ✅ Projeden bir üyeyi çıkar (sadece yetkililer)
router.delete(
  '/:projectId/members/:userId',
  verifyToken,
  checkMemberManagePermission,
  projectMemberController.removeMember
);

// ✅ Kullanıcının proje içindeki rolünü güncelle (sadece yetkililer)
router.patch(
  '/:projectId/members/:userId',
  verifyToken,
  checkMemberManagePermission,
  projectMemberController.updateRole
);

module.exports = router;
