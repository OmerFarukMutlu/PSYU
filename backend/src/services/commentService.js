const { Comment, User, Issue } = require('../models');

// ✅ Yorum oluşturma
const createComment = async ({ content, metadata, issueId, userId, attachmentUrl }) => {
  return await Comment.create({ content, metadata, issueId, userId, attachmentUrl });
};

// ✅ Belirli bir göreve ait tüm yorumları getir
const getCommentsByIssue = async (issueId) => {
  return await Comment.findAll({
    where: { issueId },
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }
    ],
    order: [['createdAt', 'ASC']]
  });
};

// ✅ Tek bir yorumu ID'ye göre getir (proje ID dahil)
const getCommentById = async (commentId) => {
  try {
    console.log("DEBUG Associations:", Object.keys(Comment.associations));

    const comment = await Comment.findByPk(commentId, {
      attributes: ['id', 'content', 'metadata', 'userId', 'issueId'],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        },
        {
          model: Issue,
          as: 'issue',
          attributes: ['id', 'projectId']
        }
      ]
    });

    console.log("DEBUG getCommentById result →", comment ? comment.toJSON() : null);
    return comment;
  } catch (err) {
    console.error("getCommentById hata:", err);
    throw err;
  }
};

// ✅ Yorumu güncelle
const updateComment = async ({ commentId, content, metadata }) => {
  const comment = await Comment.findByPk(commentId);
  if (!comment) return null;

  comment.content = content ?? comment.content;
  comment.metadata = metadata ?? comment.metadata;
  comment.isEdited = true;

  await comment.save();
  return comment;
};

// ✅ Yorumu sil (proje ID dahil)
const deleteComment = async (commentId) => {
  const comment = await getCommentById(commentId); // Tek noktadan veri al
  if (!comment) return null;

  console.log("DEBUG deleteComment service → siliniyor:", comment.id);
  await comment.destroy();

  return comment.toJSON(); // JSON döndür ki controller kolay işlesin
};

module.exports = {
  createComment,
  getCommentsByIssue,
  getCommentById,
  updateComment,
  deleteComment
};
