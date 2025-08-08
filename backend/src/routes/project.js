const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/authMiddleware');
const checkProjectAccess = require('../middlewares/projectAccess');
const checkRole = require('../middlewares/roleMiddleware');
const projectController = require('../controllers/projectController');

// 🔌 Socket.io nesnesini req.io'ya ekle (emit için)
try {
  const { getIO } = require('../socket');
  router.use((req, _res, next) => {
    try { req.io = getIO(); } catch (_) {}
    next();
  });
} catch (_) {
  // socket modülü yoksa sessizce devam
}

// 🔹 Proje oluştur (yetkili roller)
router.post(
  '/',
  verifyToken,
  checkRole(['admin', 'admin_helper', 'project_manager']),
  projectController.createProject
);

// 🔹 Tüm projeler
router.get('/', verifyToken, projectController.getProjects);

// 🔹 Proje detay
router.get('/:id', verifyToken, checkProjectAccess, projectController.getProjectById);

// 🔹 Güncelle
router.put('/:id', verifyToken, checkProjectAccess, projectController.updateProject);

// 🔹 Sil
router.delete('/:id', verifyToken, checkProjectAccess, projectController.deleteProject);

module.exports = router;
