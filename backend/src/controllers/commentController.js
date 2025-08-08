const commentService = require('../services/commentService');
const { getCommentById: getCommentByIdService, createComment: createCommentService } = commentService;
const { Comment, User, CommentAttachment, ProjectMember, Issue } = require('../models');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });
const { io } = require('../app'); // app.js'te io export edilmişti

// WS emit güvenli çağrı (io yoksa socket.getIO dener)
const safeEmit = (event, payload) => {
  try {
    if (io) return io.emit(event, payload);
    // fallback
    const { getIO } = require('../socket');
    getIO()?.emit(event, payload);
  } catch (e) {
    console.warn('WS emit hatası:', e?.message);
  }
};

// ✅ Tek yorum detayı (API için)
const getCommentById = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    res.json(comment);
  } catch (error) {
    console.error('getCommentById hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// ✅ Yorum oluştur
const createComment = async (req, res) => {
  try {
    const { content, metadata } = req.body;
    const { issueId } = req.params;
    const userId = req.user.id;

    if (!content && !req.file) {
      return res.status(400).json({ message: 'İçerik veya dosya zorunludur' });
    }
    if (!issueId) {
      return res.status(400).json({ message: 'Görev bilgisi zorunludur' });
    }

    const comment = await createCommentService({ content, metadata, issueId, userId });

    if (req.file) {
      await CommentAttachment.create({
        commentId: comment.id,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer
      });
    }

    const fullComment = await Comment.findByPk(comment.id, {
      attributes: ['id', 'content', 'metadata', 'createdAt'],
      include: [
        { model: User, as: 'author', attributes: ['id', 'username', 'role'] },
        { model: CommentAttachment, as: 'attachment', attributes: ['id', 'filename'] }
      ]
    });

    // 🔥 Eksik olan kısım: issueId'yi elle ekle
    const result = {
      ...fullComment.toJSON(),
      issueId: parseInt(issueId), // 👈 kritik
    };

    // ✅ WebSocket bildirimi
    safeEmit('receiveComment', result);

    res.status(201).json({ result });
  } catch (err) {
    console.error('Yorum ekleme hatası:', err);
    res.status(500).json({ error: err.message });
  }
};


// ✅ Yorumları getir
const getComments = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findByPk(issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }
    const projectId = issue.projectId;

    const comments = await Comment.findAll({
      where: { issueId },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'role'],
          include: [
            {
              model: ProjectMember,
              as: 'projectMemberships',
              attributes: ['role'],
              where: { projectId },
              required: false
            }
          ]
        },
        { model: CommentAttachment, as: 'attachment', attributes: ['id', 'filename'] }
      ],
      attributes: ['id', 'content', 'metadata', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    const result = comments.map(c => {
      const json = c.toJSON();
      json.projectRole = json.author?.projectMemberships?.[0]?.role || null;
      json.globalRole = json.author?.role || null;
      delete json.author?.projectMemberships;
      return json;
    });

    res.json({ result });
  } catch (err) {
    console.error('Yorumları getirme hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Yorumu güncelle (içerik + dosya ekle/degistir/kaldır)
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, metadata } = req.body;
    const removeAttachment = String(req.body.removeAttachment || '').toLowerCase() === 'true';

    const comment = await Comment.findByPk(commentId);
    if (!comment) return res.status(404).json({ message: 'Yorum bulunamadı' });

    const canEdit =
      comment.userId === req.user.id ||
      ['admin', 'admin_helper'].includes(req.user.role);

    if (!canEdit) {
      return res.status(403).json({ message: 'Düzenleme yetkiniz yok' });
    }

    // İçerik/metadata güncelle
    await comment.update({ content, metadata });

    // Mevcut eklenti var mı?
    const existingAttachment = await CommentAttachment.findOne({ where: { commentId } });

    // Yeni dosya geldiyse → eskisini sil, yenisini oluştur
    if (req.file) {
      if (existingAttachment) await existingAttachment.destroy();
      await CommentAttachment.create({
        commentId,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer
      });
    } else if (removeAttachment && existingAttachment) {
      // "Dosyayı kaldır" işaretlendiyse
      await existingAttachment.destroy();
    }

    const updatedComment = await Comment.findByPk(commentId, {
      attributes: ['id', 'content', 'metadata', 'createdAt', 'issueId'],
      include: [
        { model: User, as: 'author', attributes: ['id', 'username'], required: false },
        { model: CommentAttachment, as: 'attachment', attributes: ['id', 'filename'], required: false }
      ]
    });

    // 🟢 WebSocket ile güncel objeyi gönder
    if (updatedComment) {
      safeEmit('updateComment', updatedComment);
    }

    res.json(updatedComment); // ✅ Tek obje döndür
  } catch (err) {
    console.error('⚠️ Yorum güncelleme hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
};

// ✅ Yorumu sil
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await getCommentByIdService(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Yorum bulunamadı' });
    }

    const projectId = comment.issue?.projectId;
    if (!projectId) {
      return res.status(400).json({ message: 'Proje ID belirlenemedi' });
    }

    const hasGlobalRole = ['admin', 'admin_helper', 'project_manager'].includes(req.user.role);
    const isTeamLead = await ProjectMember.findOne({
      where: { userId: req.user.id, projectId, role: 'team_lead' }
    });

    if (!hasGlobalRole && !isTeamLead) {
      return res.status(403).json({ message: 'Silme yetkiniz yok' });
    }

    await comment.destroy();
    res.json({ message: 'Yorum silindi', deletedId: comment.id });
  } catch (err) {
    console.error('Yorum silme hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Kendi yorumlarını getir
const getMyComments = async (req, res) => {
  try {
    const userId = req.user.id;

    const comments = await Comment.findAll({
      where: { userId },
      include: [
        { model: User, as: 'author', attributes: ['id', 'username'] },
        { model: CommentAttachment, as: 'attachment', attributes: ['id', 'filename'] }
      ],
      attributes: ['id', 'content', 'metadata', 'createdAt', 'userId'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ result: comments });
  } catch (err) {
    console.error('getMyComments hatası:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Dosya görüntüle
const viewFile = async (req, res) => {
  try {
    const file = await CommentAttachment.findByPk(req.params.id);
    if (!file) return res.status(404).send('Dosya bulunamadı');

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', 'inline');
    res.send(file.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Dosya görüntülenemedi');
  }
};

// ✅ Dosya indir
const downloadFile = async (req, res) => {
  try {
    const file = await CommentAttachment.findByPk(req.params.id);
    if (!file) return res.status(404).send('Dosya bulunamadı');

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Dosya indirilemedi');
  }
};

// ✅ Debug endpoint
const debugComment = async (req, res) => {
  try {
    const comment = await getCommentByIdService(req.params.id);
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createComment: [upload.single('attachment'), createComment],
  getComments,
  getCommentById,
  updateComment: [upload.single('attachment'), updateComment], // ⬅️ multipart destek
  deleteComment,
  getMyComments,
  viewFile,
  downloadFile,
  debugComment
};
