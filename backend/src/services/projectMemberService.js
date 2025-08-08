const { Project, ProjectMember, User } = require('../models');

const checkProjectOwnerOrAdmin = async (projectId, user) => {
  const project = await Project.findByPk(projectId);
  if (!project) return { error: 'Proje bulunamadı' };

  const isOwner = project.createdBy === user.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return { error: 'Bu projede değişiklik yapma yetkiniz yok' };
  }

  return { project };
};

const addProjectMember = async (projectId, userId, role = 'developer') => {
  const user = await User.findByPk(userId);
  if (!user) {
    console.warn('❌ Kullanıcı bulunamadı:', userId);
    return { error: 'Kullanıcı bulunamadı' };
  }

  const existing = await ProjectMember.findOne({ where: { projectId, userId } });
  if (existing) {
    console.warn(`⚠️ Kullanıcı zaten projeye ekli (projectId: ${projectId}, userId: ${userId})`);
    return { error: 'Bu kullanıcı zaten bu projeye eklenmiş' };
  }

  try {
    const member = await ProjectMember.create({ projectId, userId, role });
    console.log('✅ Yeni üye eklendi:', member.toJSON());
    return { member };
  } catch (err) {
    console.error('❌ Üye oluşturulurken hata:', err);
    return { error: 'Üye eklenirken sunucu hatası oluştu' };
  }
};

const removeProjectMember = async (projectId, userId) => {
  const deleted = await ProjectMember.destroy({ where: { projectId, userId } });
  if (deleted === 0) return { error: 'Üye bulunamadı' };
  return { success: true };
};

const listProjectMembers = async (projectId) => {
  return await ProjectMember.findAll({
    where: { projectId },
    include: [
      {
        model: User,
        as: 'user', // Modelde tanımlanan alias
        attributes: ['id', 'fullname', 'username']
      }
    ]
  });
};

const isUserMemberOrAdminOrOwner = async (projectId, user) => {
  const project = await Project.findByPk(projectId);
  if (!project) return false;

  const isOwner = project.createdBy === user.id;
  const isAdmin = user.role === 'admin';

  if (isOwner || isAdmin) return true;

  const member = await ProjectMember.findOne({
    where: { projectId, userId: user.id }
  });

  return !!member;
};

module.exports = {
  checkProjectOwnerOrAdmin,
  addProjectMember,
  removeProjectMember,
  listProjectMembers,
  isUserMemberOrAdminOrOwner
};
