module.exports = (sequelize, DataTypes) => {
  const CommentAttachment = sequelize.define('CommentAttachment', {
    commentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Comments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    data: {
      type: DataTypes.BLOB('long'), // PostgreSQL -> BYTEA
      allowNull: false
    }
  }, {
    tableName: 'comment_attachments',
    timestamps: true
  });

  CommentAttachment.associate = (models) => {
    CommentAttachment.belongsTo(models.Comment, {
      foreignKey: 'commentId',
      as: 'comment',
      onDelete: 'CASCADE'
    });
  };

  return CommentAttachment;
};
