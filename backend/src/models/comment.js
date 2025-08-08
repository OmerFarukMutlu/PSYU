module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    attachmentUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    issueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Issues', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    tableName: 'Comments'
  });

  Comment.beforeUpdate((comment) => {
    comment.isEdited = true;
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'author'
    });

    Comment.belongsTo(models.Issue, {
      foreignKey: 'issueId',
      as: 'issue' // 🔹 Join için alias
    });

    Comment.hasOne(models.CommentAttachment, {
      foreignKey: 'commentId',
      as: 'attachment',
      onDelete: 'CASCADE'
    });
  };

  return Comment;
};
