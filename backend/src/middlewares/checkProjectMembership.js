const { hasProjectAccess, getProjectIdFromIssue } = require('../utils/permissionUtils');
const { Comment, Issue } = require('../models');

const checkProjectAccess = async (req, res, next) => {
  try {
    let projectId =
      req.params.projectId ||
      req.params.id ||
      req.projectIdFromIssue;

    // Eğer projectId yoksa issueId üzerinden bul
    if (!projectId && req.params.issueId) {
      projectId = await getProjectIdFromIssue(req.params.issueId);
      if (projectId) {
        req.projectIdFromIssue = projectId;
      }
    }

    // Eğer hala yoksa commentId üzerinden bul
    if (!projectId && req.params.commentId) {
      const comment = await Comment.findByPk(req.params.commentId, {
        include: [{ model: Issue, as: 'issue', attributes: ['projectId'] }] // alias eklendi
      });
      if (comment && comment.issue) { // alias ismi küçük harf ile
        projectId = comment.issue.projectId;
        req.projectIdFromIssue = projectId;
      }
    }

    // Hala yoksa hata
    if (!projectId) {
      return res.status(400).json({ message: 'Proje ID belirlenemedi' });
    }

    // Yetki kontrolü
    const access = await hasProjectAccess(projectId, req.user);
    if (!access) {
      return res.status(403).json({ message: 'Bu projeye erişim yetkiniz yok' });
    }

    next();
  } catch (error) {
    console.error('checkProjectAccess hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', detail: error.message });
  }
};

module.exports = checkProjectAccess;
