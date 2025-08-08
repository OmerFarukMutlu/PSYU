const { Project, User, ProjectMember } = require('../models');
const { Op } = require('sequelize');

/**
 * Yeni proje oluşturur.
 */
const createProject = async (data) => {
  return await Project.create(data);
};

/**
 * Tüm projeleri listeler (admin, admin_helper, project_manager için).
 */
const getAllProjects = async () => {
  return await Project.findAll({
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullname', 'username']
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'fullname', 'username'],
        through: { attributes: ['role'] }
      }
    ],
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Kullanıcının oluşturduğu veya üye olduğu projeleri listeler.
 */
const getUserProjects = async (userId) => {
  return await Project.findAll({
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullname', 'username']
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'fullname', 'username'],
        through: {
          where: { userId },
          attributes: ['role']
        },
        required: false
      }
    ],
    where: {
      [Op.or]: [
        { createdBy: userId },
        { '$members.id$': userId } // belongsToMany ilişkisi için doğru yol
      ]
    },
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Belirli bir projeyi ID ile getirir.
 */
const getProjectById = async (id) => {
  return await Project.findByPk(id, {
    attributes: ['id', 'name', 'description', 'createdBy', 'startDate', 'endDate', 'createdAt'],
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullname', 'username']
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'fullname', 'username'],
        through: {
          attributes: ['role']
        }
      }
    ]
  });
};

/**
 * Projeyi günceller.
 */
const updateProject = async (id, updates) => {
  const project = await Project.findByPk(id);
  if (!project) return null;
  await project.update(updates);
  return project;
};

/**
 * Projeyi siler (soft delete).
 */
const deleteProject = async (id) => {
  console.log(`Projeyi silme isteği alındı: id=${id}`);
  const project = await Project.findByPk(id);
  if (!project) {
    console.log('Proje bulunamadı, silme işlemi yapılmadı.');
    return null;
  }
  await project.destroy({ force: true }); // Kalıcı silme
  console.log('Proje başarıyla kalıcı silindi.');
  return true;
};

module.exports = {
  createProject,
  getAllProjects,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject
};
