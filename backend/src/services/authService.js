const bcrypt = require('bcrypt');
const { User } = require('../models');
const { generateToken } = require('../utils/tokenUtils');
const { Op } = require('sequelize');

/**
 * Kullanıcı kayıt işlemi
 */
const registerUser = async ({ username, email, password, fullname }) => {
  if (!username || !email || !password || !fullname) {
    throw new Error('Kullanıcı adı, ad soyad, e-posta ve şifre zorunludur');
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
    fullname
  });

  return newUser;
};

/**
 * Kullanıcı giriş işlemi
 */
const loginUser = async ({ email, username, password }) => {
  let user;

  if (email) {
    user = await User.findOne({ where: { email } });
  } else if (username) {
    user = await User.findOne({ where: { username } });
  } else {
    return { error: "Kullanıcı adı veya e-posta gerekli" };
  }

  if (!user) return { error: "Kullanıcı bulunamadı" };

  // ✅ Pasif kullanıcı kontrolü (şifre kontrolünden önce)
  if (!user.isActive) {
    return { error: "Kullanıcı aktif değil", code: 403 };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { error: "Geçersiz şifre" };

  const token = generateToken({ id: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      isActive: user.isActive // ✅ Giriş yapan kişinin aktif/pasif bilgisi
    }
  };
};

module.exports = {
  registerUser,
  loginUser
};
