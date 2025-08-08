const { Project, ProjectMember, Issue, Comment } = require('../models');

/**
 * Kullanıcı bu projeye erişebilir mi? (admin, owner, member)
 */
const hasProjectAccess = async (projectId, user) => {
  if (user.role === 'admin') return true;

  const project = await Project.findByPk(projectId);
  if (!project) return false;

  if (project.createdBy === user.id) return true;

  const member = await ProjectMember.findOne({
    where: { projectId, userId: user.id }
  });

  return !!member;
};

/**
 * Kullanıcı bu projeyi yönetebilir mi? (admin veya owner)
 */
const canManageProject = async (projectId, user) => {
  if (user.role === 'admin') return true;

  const project = await Project.findByPk(projectId);
  if (!project) return false;

  return project.createdBy === user.id;
};

/**
 * issueId veya commentId üzerinden projectId'yi bul
 */
const getProjectIdFromIssue = async (issueId, commentId = null) => {
  // Öncelikle issueId ile bul
  if (issueId) {
    const issue = await Issue.findByPk(issueId);
    return issue ? issue.projectId : null;
  }

  // commentId varsa comment üzerinden bul
  if (commentId) {
    const comment = await Comment.findByPk(commentId, {
      include: [
        { model: Issue, as: 'issue', attributes: ['projectId'] }
      ]
    });
    return comment && comment.issue ? comment.issue.projectId : null;
  }

  return null;
};

module.exports = {
  hasProjectAccess,
  canManageProject,
  getProjectIdFromIssue
};
