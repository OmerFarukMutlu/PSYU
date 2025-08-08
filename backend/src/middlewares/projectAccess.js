const { hasProjectAccess, getProjectIdFromIssue } = require('../utils/permissionUtils');

const checkProjectAccess = async (req, res, next) => {
  try {
    let projectId =
      req.params.projectId ||
      req.params.id ||
      req.projectIdFromIssue;

    // issueId veya commentId ile bulma
    if (!projectId) {
      projectId = await getProjectIdFromIssue(req.params.issueId, req.params.commentId);
      if (projectId) {
        req.projectIdFromIssue = projectId;
      }
    }

    if (!projectId) {
      return res.status(400).json({ message: 'Proje ID belirlenemedi' });
    }

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
