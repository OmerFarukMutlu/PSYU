const projectMemberService = require('../services/projectMemberService');
const { User, Project, ProjectMember } = require('../models');
const { getIO } = require('../socket'); // 🔌 socket eklendi

// ✅ Üye ekle
const addMember = async (req, res) => {
  const { projectId } = req.params;
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ message: 'Kullanıcı ve rol zorunludur' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    const result = await projectMemberService.addProjectMember(projectId, user.id, role);

    if (result.error) {
      return res.status(400).json({
        message: result.error === 'Kullanıcı zaten üye'
          ? 'Bu kullanıcı zaten bu projede mevcut ve bir role sahip.'
          : result.error
      });
    }

    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullname', 'username'] },
        {
          model: ProjectMember,
          as: 'projectMembers',
          include: [{ model: User, as: 'user', attributes: ['id', 'fullname', 'username'] }]
        }
      ]
    });

    const io = getIO();

    // 📡 Projeyi açık olan herkese güncelleme gönder
    io.to(String(projectId)).emit('projectMemberUpdated', { project });

    // 📡 Eklenen kullanıcıya da projeler listesine eklemesi için gönder
    io.to(`user:${userId}`).emit('projectAddedForUser', { project });

    console.log(`🎯 [SOCKET] projectMemberUpdated emit edildi → user: ${user.id}`);

    res.status(201).json({ message: 'Kullanıcı projeye eklendi', member: result.member });
  } catch (err) {
    console.error('❌ Üye ekleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// ✅ Üye sil
const removeMember = async (req, res) => {
  const { projectId, userId } = req.params;

  try {
    const result = await projectMemberService.removeProjectMember(projectId, userId);
    if (!result.success) return res.status(404).json({ message: 'Üye bulunamadı' });

    // Projenin güncel halini çek
    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullname', 'username'] },
        {
          model: ProjectMember,
          as: 'projectMembers',
          include: [{ model: User, as: 'user', attributes: ['id', 'fullname', 'username'] }]
        }
      ]
    });

    const io = getIO();

    // 🔔 Atılan kullanıcıya bireysel bildirim
    io.to(`user:${userId}`).emit('kickedFromProject', {
      projectId: String(projectId),
      userId: Number(userId)
    });

    // 🔔 Proje odasındaki herkese güncelleme gönder
    io.to(String(projectId)).emit('projectMemberUpdated', { project });

    console.log(`🚪 [SOCKET] Kullanıcı projeden çıkarıldı → user: ${userId}`);

    res.json({ message: 'Üye başarıyla silindi' });
  } catch (err) {
    console.error('❌ Üye silme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// ✅ Üye listele
const listMembers = async (req, res) => {
  const { projectId } = req.params;

  try {
    const members = await projectMemberService.listProjectMembers(projectId);
    res.json({ result: members });
  } catch (err) {
    console.error('❌ Üye listeleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// ✅ ROL GÜNCELLEME
const updateRole = async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;

  if (!role) return res.status(400).json({ message: 'Yeni rol zorunludur' });

  try {
    const member = await ProjectMember.findOne({ where: { projectId, userId } });
    if (!member) return res.status(404).json({ message: 'Proje üyesi bulunamadı' });

    member.role = role;
    await member.save();

    // ✅ Güncel proje verisini getir
    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullname', 'username'] },
        {
          model: ProjectMember,
          as: 'projectMembers',
          include: [{ model: User, as: 'user', attributes: ['id', 'fullname', 'username'] }]
        }
      ]
    });

    const io = getIO();

    // 📡 Proje odasındaki herkese rol değişikliğini gönder
    io.to(String(projectId)).emit('projectMemberUpdated', { project });

    // 📡 Rolü değişen kullanıcıya da bilgi ver
    io.to(`user:${userId}`).emit('projectMemberRoleChanged', {
      projectId: String(projectId),
      newRole: role
    });

    console.log(`🟢 [SOCKET] Rol güncellendi → user: ${userId}, role: ${role}`);

    res.json({ message: 'Rol başarıyla güncellendi', member });
  } catch (err) {
    console.error('❌ Rol güncelleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

module.exports = {
  addMember,
  removeMember,
  listMembers,
  updateRole
};
