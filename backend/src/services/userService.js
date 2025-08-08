const bcrypt = require('bcrypt');
const { User } = require('../models');
const { Op } = require('sequelize');

// 🔹 ID'ye göre kullanıcı getir
const getUserById = async (id, excludePassword = true) => {
  return await User.findByPk(id, {
    attributes: excludePassword ? { exclude: ['password'] } : undefined
  });
};

// 🔹 Aktiflik durumunu güncelle
const setActiveStatus = async (userId, isActive) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  user.isActive = isActive;
  await user.save();
  return user;
};

// 🔹 Proje üyeliği gibi durumlar için sade kullanıcı listesi
const getAllUsers = async () => {
  return await User.findAll({
    attributes: ['id', 'username', 'fullname', 'email']
  });
};

// 🔍 İsme göre kullanıcı arama (search box için)
const searchUsersByName = async (query) => {
  return await User.findAll({
    where: {
      [Op.or]: [
        { fullname: { [Op.iLike]: `%${query}%` } },
        { username: { [Op.iLike]: `%${query}%` } }
      ]
    },
    attributes: ['id', 'username', 'fullname', 'email']
  });
};

// ✅ Admin paneli için tüm kullanıcıları getir (onlyActive opsiyonu ile)
const getAllForAdminPanel = async ({ onlyActive = false } = {}) => {
  const whereClause = onlyActive ? { isActive: true } : {};
  return await User.findAll({
    where: whereClause,
    attributes: [
      'id',
      'fullname',
      'username',
      'email',
      'role',
      'isActive',
      'isMainAdmin',
      'createdAt',
      'updatedAt'
    ],
    order: [['createdAt', 'DESC']]
  });
};

// ✅ Sadece DB işlemi yapar, HTTP response ile uğraşmaz
const updateUserRole = async (userId, newRole) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  if (user.isMainAdmin) return 'FORBIDDEN'; // Ana admin rolü değiştirilemez

  user.role = newRole;
  await user.save();
  return user;
};

const updateUser = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  await user.update(data);
  return user;
};

// ✅ Admin panelinden yeni kullanıcı oluştur
const createUserByAdmin = async ({ username, email, password, fullname, role, isActive }) => {
  if (!username || !email || !password || !fullname || !role) {
    throw new Error('Tüm alanlar (username, email, fullname, password, role) zorunludur.');
  }

  if (role === 'admin') {
    throw new Error('Admin rolü sadece sistem tarafından atanabilir.');
  }

  const exists = await User.findOne({
    where: { [Op.or]: [{ email }, { username }] }
  });

  if (exists) {
    throw new Error('Bu kullanıcı adı veya e-posta zaten alınmış');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    fullname,
    role,
    isActive: isActive !== undefined ? isActive : true
  });

  return {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    fullname: newUser.fullname,
    role: newUser.role,
    isActive: newUser.isActive,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt
  };
};

module.exports = {
  getUserById,
  setActiveStatus,
  getAllUsers,
  searchUsersByName,
  getAllForAdminPanel,
  updateUserRole,
  createUserByAdmin,
  updateUser
};
