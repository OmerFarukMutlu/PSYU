const express = require('express');
const listEndpoints = require('express-list-endpoints');
const cors = require('cors');
const pgtools = require('pgtools');
require('dotenv').config();
const path = require('path');
const { sequelize, Comment } = require('./models');

const http = require('http');
const app = express();
const server = http.createServer(app);

// === SOCKET.IO ===
const socket = require('./socket');
const io = socket.init(server);

// ⬇️ EKLENDİ: io'yu app'e koy ve req.io olarak erişilebilir yap
app.set('io', io);
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// === STATIK DOSYA SERVISI ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === CORS ===
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// === JSON PARSE ===
app.use(express.json());

// === ROUTE DOSYALARI ===
const authRoutes = require('./routes/auth');
const secretRoutes = require('./routes/secret');
const userRoutes = require('./routes/user');
const projectRoutes = require('./routes/project');
const projectMemberRoutes = require('./routes/projectMember');
const issueRoutes = require('./routes/issues');
const commentRoutes = require('./routes/comment');
const issueHistoryRoutes = require('./routes/issueHistory');
const myCommentRoutes = require('./routes/myComments');
const securityCodeRoutes = require('./routes/securityCode');
const resetPasswordRoutes = require('./routes/resetPassword');

// === ROUTE BAGLANTI ===
app.use('/api/auth', authRoutes);
app.use('/api/secret', secretRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', projectMemberRoutes);
app.use('/api/projects/:projectId/issues', issueRoutes);
app.use('/api/projects/:projectId/issues/:issueId/comments', commentRoutes);
app.use('/api/projects/:projectId/history', issueHistoryRoutes);
// ⚠️ Bu iki satır duplicate olabilir, sadece birini bırakman yeterli
app.use('/api/issues', issueRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/comments', myCommentRoutes);
app.use('/api/password-reset', resetPasswordRoutes);
app.use('/api/security-code', securityCodeRoutes);

// === TEST ENDPOINT ===
app.get('/', (req, res) => {
  res.send('API çalışıyor.');
});

// === DB AYARLARI ===
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT
};
const port = process.env.PORT || 3000;

// === VERITABANI OLUŞTUR VE SENKRONIZE ET ===
pgtools.createdb(dbConfig, process.env.DB_NAME)
  .then(() => {
    console.log(`✅ Veritabanı '${process.env.DB_NAME}' başarıyla oluşturuldu.`);
    return sequelize.sync({ alter: true });
  })
  .catch(err => {
    if (err.name === 'duplicate_database') {
      console.log(`ℹ️ Veritabanı zaten var: '${process.env.DB_NAME}'`);
      return sequelize.sync({ alter: true });
    } else {
      console.error('❌ Veritabanı oluşturulamadı:', err);
      process.exit(1);
    }
  })
  .then(() => {
    console.log("DEBUG Associations on start:", Object.keys(Comment.associations));
    console.log('🟢 Tablolar senkronize edildi.');

    server.listen(port, () => {
      console.log(`🚀 Sunucu http://localhost:${port}`);
      const endpoints = listEndpoints(app);
      endpoints.forEach(({ methods, path }) => {
        console.log(`${methods.join(', ')} ${path}`);
      });
    });
  })
  .catch(err => {
    console.error('❌ DB bağlantı/senkronizasyon hatası:', err);
  });

module.exports = { app, server };
