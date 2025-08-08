const express = require('express');
const router = express.Router({ mergeParams: true });

const verifyToken = require('../middlewares/authMiddleware');
const checkProjectMembership = require('../middlewares/checkProjectMembership');
const commentController = require('../controllers/commentController');

// Not: commentController içi zaten multer ile export ediyor:
//   createComment: [upload.single('attachment'), createComment]
//   updateComment: [upload.single('attachment'), updateComment]
// O yüzden bu router'da ekstra multer kullanmıyoruz.

// ── Dosya görüntüleme/indirme (param route'lardan önce)
router.get('/files/view/:id', commentController.viewFile);
router.get('/files/download/:id', commentController.downloadFile);

// ── Debug (param route'lardan önce olmalı)
router.get('/debug/:id', commentController.debugComment);

// ── Nested: /api/projects/:projectId/issues/:issueId/comments
// Proje/issue bağlamında oluşturma & listeleme => üyelik kontrolü gerekir
router.post('/', verifyToken, checkProjectMembership, commentController.createComment);
router.get('/', verifyToken, checkProjectMembership, commentController.getComments);

// ── Tek yorum id ile (flat /api/comments/... altında da çalışmalı)
// Burada project membership zorunlu değil; controller içinde yetki kontrolü var.
router.get('/:commentId', verifyToken, commentController.getCommentById);

// PATCH ve PUT ikisini de destekle (frontend hangisini gönderirse)
router.patch('/:commentId', verifyToken, commentController.updateComment);
router.put('/:commentId', verifyToken, commentController.updateComment);

router.delete('/:commentId', verifyToken, commentController.deleteComment);

module.exports = router;
