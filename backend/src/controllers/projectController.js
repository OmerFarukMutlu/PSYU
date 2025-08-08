const projectService = require('../services/projectService');
const { Project, ProjectMember, User } = require('../models');
const { getIO } = require('../socket');

/**
 * Proje oluştur
 */
const createProject = async (req, res) => {
  const { name: rawName, description: rawDesc } = req.body;
  const userId = req.user.id;

  const name = (rawName || '').trim();
  const description = (rawDesc || '').trim();

  try {
    if (!name) {
      return res.status(400).json({ success: false, message: 'Proje adı gerekli' });
    }

    const existing = await Project.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Bu proje adı zaten kullanılıyor' });
    }

    const project = await Project.create({ name, description, createdBy: userId });

    await ProjectMember.create({
      projectId: project.id,
      userId,
      role: 'project_manager',
      isActive: true
    });

    const fullProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullname', 'username'] },
        {
          model: ProjectMember,
          as: 'projectMembers',
          include: [{ model: User, as: 'user', attributes: ['id', 'fullname', 'username'] }]
        }
      ]
    });

    if (!fullProject) {
      return res.status(500).json({ message: 'Proje detayları alınamadı' });
    }

    const io = getIO();
    io.emit('projectCreated', { project: fullProject });

    return res.status(201).json({
      success: true,
      message: 'Proje başarıyla oluşturuldu',
      result: fullProject
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Bu proje adı zaten kullanılıyor' });
    }
    return res.status(500).json({ success: false, message: 'Proje oluşturulamadı', error: err.message });
  }
};

/**
 * Projeleri getir (rol kontrolü ile)
 */
const getProjects = async (req, res) => {
  try {
    let projects;
    const fullAccessRoles = ['admin', 'admin_helper', 'project_manager'];

    if (fullAccessRoles.includes(req.user.role)) {
      projects = await projectService.getAllProjects();
    } else {
      projects = await projectService.getUserProjects(req.user.id);
    }

    res.json({ result: projects });
  } catch (err) {
    console.error('❌ Proje listeleme hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Proje detayını getir
 */
const getProjectById = async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Proje bulunamadı' });
    res.json({ result: project });
  } catch (err) {
    console.error('❌ Proje detay hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Proje güncelle
 */
const updateProject = async (req, res) => {
  try {
    const updates = {
      name: req.body.name,
      description: req.body.description,
      startDate: req.body.startDate,
      endDate: req.body.endDate
    };

    const project = await projectService.updateProject(req.params.id, updates);
    if (!project) return res.status(404).json({ message: 'Proje bulunamadı' });

    res.json({ message: 'Proje güncellendi', result: project });
  } catch (err) {
    console.error('❌ Proje güncelleme hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Proje sil
 */
const deleteProject = async (req, res) => {
  try {
    const pid = String(req.params.id);

    // 🔎 Üyeleri silmeden önce al (kişisel odalara bildirim için)
    const members = await ProjectMember.findAll({
      where: { projectId: pid },
      attributes: ['userId']
    });

    const success = await projectService.deleteProject(pid);
    if (!success) return res.status(404).json({ message: 'Proje bulunamadı' });

    // 🔔 WS yayınları
    const io = getIO();

    // Liste ekranları (genel)
    io.emit('projectDeleted', { projectId: pid });

    // Proje sayfasını açık tutanlar (oda)
    io.to(pid).emit('projectDeleted', { projectId: pid });

    // Üyelerin kişisel odaları (diğer sekmelerde/dashboards vs.)
    if (Array.isArray(members)) {
      for (const m of members) {
        io.to(`user:${m.userId}`).emit('projectDeleted', { projectId: pid });
      }
    }

    res.json({ message: 'Proje başarıyla silindi' });
  } catch (err) {
    console.error('❌ Proje silme hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};
