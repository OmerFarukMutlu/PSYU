const express = require('express');
const router = express.Router({ mergeParams: true });
const verifyToken = require('../middlewares/authMiddleware');
const checkProjectMembership = require('../middlewares/checkProjectMembership');
const issueController = require('../controllers/issueController');
const commentController = require('../controllers/commentController');
const { Issue, Project, ProjectMember } = require('../models');

// CREATE
router.post('/', verifyToken, checkProjectMembership, issueController.createIssue);

// READ - tüm görevler
router.get('/', verifyToken, checkProjectMembership, issueController.getIssues);

// READ - tek görev detayı + açıklama + proje rolü
router.get('/:issueId', verifyToken, checkProjectMembership, async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findByPk(issueId, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'createdBy'],
          include: [
            {
              model: ProjectMember,
              as: 'projectMembers', // ✅ alias düzeltildi
              where: { userId: req.user.id },
              attributes: ['role'],
              required: false
            }
          ]
        }
      ]
    });

    if (!issue) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    const projectRole = issue.project?.projectMembers?.[0]?.role || null;

    res.json({
      result: {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        projectId: issue.projectId,
        createdBy: issue.project?.createdBy,
        projectRole
      }
    });
  } catch (err) {
    console.error('Görev detayı getirme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// UPDATE (tam güncelleme için)
router.put('/:issueId', verifyToken, checkProjectMembership, issueController.updateIssue);

// ✅ PATCH DESTEKLENSİN (drag-drop için)
router.patch('/:issueId', verifyToken, checkProjectMembership, issueController.updateIssue);

// DELETE
router.delete('/:id', verifyToken, checkProjectMembership, issueController.deleteIssue);

// ✅ COMMENT ROUTES: issue üzerinden proje erişimi çıkarılır
router.post(
  '/:issueId/comments',
  verifyToken,
  async (req, res, next) => {
    try {
      const issue = await Issue.findByPk(req.params.issueId);
      if (!issue) return res.status(404).json({ message: 'Görev bulunamadı' });
      req.projectIdFromIssue = issue.projectId;
      next();
    } catch (err) {
      console.error('Proje ID alınırken hata:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  },
  checkProjectMembership,
  commentController.createComment
);

router.get('/:issueId/comments', verifyToken, checkProjectMembership, commentController.getComments);

module.exports = router;
