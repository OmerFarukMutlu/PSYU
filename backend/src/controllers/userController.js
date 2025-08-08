const { Op } = require('sequelize');
const { User } = require('../models');
const userService = require('../services/userService');

// 🔐 Giriş yapmış kullanıcının kendi profilini getirir
const getMyProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    if (!user.isActive) {
      return res.status(403).json({ message: 'Hesabınız pasif. Lütfen yöneticinizle iletişime geçin.' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔐 ID’ye göre kullanıcı bilgisi getirir (admin erişimi)
const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔄 Kullanıcının aktif/pasif durumunu değiştirir (admin)
const updateActiveStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await userService.setActiveStatus(req.params.id, isActive);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    // 🔔 Admin listeleri için broadcast
    try {
      req.io?.emit('admin:activeUpdated', { userId: user.id, isActive: user.isActive });
    } catch (e) {
      console.warn('WS emit admin:activeUpdated başarısız:', e?.message);
    }

    // 🔔 İlgili kullanıcıya bireysel
    try {
      req.io?.to(`user:${user.id}`).emit('activeUpdated', { isActive: user.isActive });
    } catch (e) {
      console.warn('WS emit activeUpdated başarısız:', e?.message);
    }

    res.json({ message: `Kullanıcı ${isActive ? 'aktif' : 'pasif'} edildi.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🌐 Public kullanım için tüm kullanıcıları getirir
const listAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ result: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔍 Kullanıcıları isimle arar
const searchUsers = async (req, res) => {
  try {
    const query = req.query.query || '';
    const users = await userService.searchUsersByName(query);
    res.json({ result: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🛡️ Proje üyeliği ekleme yetkisine sahip rollerin görebileceği tüm kullanıcılar
const getAllUsers = async (req, res) => {
  try {
    // Sadece aktif kullanıcılar
    const users = await userService.getAllForAdminPanel({ onlyActive: true });
    res.json({ result: users });
  } catch (err) {
    console.error("Kullanıcı listesi hatası:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// 🔁 Kullanıcının rolünü admin panelden günceller
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Yeni rol belirtilmedi' });
    }

    const result = await userService.updateUserRole(req.params.id, role);

    if (result === null) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    if (result === 'FORBIDDEN') {
      return res.status(403).json({ message: 'Ana adminin rolü değiştirilemez' });
    }

    // 🔔 Admin listeleri için broadcast
    try {
      req.io?.emit('admin:roleUpdated', { userId: result.id, role: result.role });
    } catch (e) {
      console.warn('WS emit admin:roleUpdated başarısız:', e?.message);
    }

    // 🔔 İlgili kullanıcıya bireysel
    try {
      req.io?.to(`user:${result.id}`).emit('roleUpdated', { role: result.role });
    } catch (e) {
      console.warn('WS emit roleUpdated başarısız:', e?.message);
    }

    res.json({ message: 'Rol başarıyla güncellendi', user: result });
  } catch (err) {
    console.error('💥 Rol güncelleme hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

// ➕ Admin panelinden yeni kullanıcı oluşturur
const createUserByAdmin = async (req, res) => {
  try {
    const { fullname, username, email, password, role, isActive } = req.body;

    // ✨ E-posta formatı
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
    if (!emailOk) {
      return res.status(400).json({ message: 'Geçerli bir e-posta adresi girin' });
    }

    // ✨ Benzersizlik (username OR email)
    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { email: (email || '').trim() },
          { username: (username || '').trim() }
        ]
      }
    });
   // ...
if (existing) {
  if (existing.email === (email || '').trim()) {
    return res.status(409).json({
      message: 'Bu e-posta adresi zaten kayıtlı',
      field: 'email'                // 👈 EKLENDİ
    });
  }
  if (existing.username === (username || '').trim()) {
    return res.status(409).json({
      message: 'Bu kullanıcı adı zaten kullanılıyor',
      field: 'username'             // 👈 EKLENDİ
    });
  }
  return res.status(409).json({
    message: 'Bu kullanıcı adı veya e-posta zaten kayıtlı',
    field: 'email'                  // 👈 biri işaretlensin
  });
}
// ...


    const newUser = await userService.createUserByAdmin({
      fullname, username, email, password, role, isActive
    });

    // 🔔 Admin listeleri için broadcast
    try {
      req.io?.emit('admin:userCreated', { user: newUser });
    } catch (e) {
      console.warn('WS emit admin:userCreated başarısız:', e?.message);
    }

    res.status(201).json({ message: 'Kullanıcı oluşturuldu', user: newUser });
  } catch (err) {
    console.error("❌ Kullanıcı oluşturma hatası:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✏️ Kullanıcı bilgilerini günceller
const updateUser = async (req, res) => {
  try {
    const { fullname, username, email } = req.body;
    if (!fullname || !username || !email) {
      return res.status(400).json({ message: "Ad Soyad, Kullanıcı Adı ve E-posta zorunludur" });
    }

    const user = await userService.getUserById(req.params.id, false);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    if (user.isMainAdmin) {
      return res.status(403).json({ message: "Ana admin bilgileri buradan değiştirilemez" });
    }

    // ✨ E-posta formatı (güncellemede de)
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
    if (!emailOk) {
      return res.status(400).json({ message: 'Geçerli bir e-posta adresi girin' });
    }

    // ✨ Benzersizlik (kendi kaydı hariç)
    const clash = await User.findOne({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: user.id } },
          { [Op.or]: [{ email: (email || '').trim() }, { username: (username || '').trim() }] }
        ]
      }
    });
   // ...
if (clash) {
  if (clash.email === (email || '').trim()) {
    return res.status(409).json({
      message: 'Bu e-posta adresi zaten kayıtlı',
      field: 'email'                // 👈 EKLENDİ
    });
  }
  if (clash.username === (username || '').trim()) {
    return res.status(409).json({
      message: 'Bu kullanıcı adı zaten kullanılıyor',
      field: 'username'             // 👈 EKLENDİ
    });
  }
  return res.status(409).json({
    message: 'Bu kullanıcı adı veya e-posta zaten kayıtlı',
    field: 'email'                  // 👈 biri işaretlensin
  });
}
// ...


    user.fullname = fullname;
    user.username = username;
    user.email = email;

    await user.save();

    // 🔔 Admin listeleri için broadcast
    try {
      req.io?.emit('admin:userUpdated', { user });
    } catch (e) {
      console.warn('WS emit admin:userUpdated başarısız:', e?.message);
    }

    res.json({ message: "Kullanıcı bilgileri güncellendi", user });
  } catch (err) {
    console.error("💥 Kullanıcı güncelleme hatası:", err);
    res.status(500).json({ error: err.message });
  }
};

// ❌ Kullanıcı siler
const deleteUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

    if (user.isMainAdmin) {
      return res.status(403).json({ message: "Ana admin silinemez" });
    }

    await user.destroy();

    // 🔔 Admin listeleri için broadcast
    try {
      req.io?.emit('admin:userDeleted', { userId: req.params.id });
    } catch (e) {
      console.warn('WS emit admin:userDeleted başarısız:', e?.message);
    }

    res.json({ message: "Kullanıcı silindi" });
  } catch (err) {
    console.error("💥 Kullanıcı silme hatası:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMyProfile,
  getUserById,
  updateActiveStatus,
  listAllUsers,
  searchUsers,
  getAllUsers,
  updateUserRole,
  createUserByAdmin,
  updateUser,
  deleteUser
};
