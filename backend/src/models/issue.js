module.exports = (sequelize, DataTypes) => {
  const Issue = sequelize.define('Issue', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'done', 'blocked'),
      allowNull: false,
      defaultValue: 'todo'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium'
    },
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Projects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdBy: { // 🔹 Görevi oluşturan kullanıcı
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Issues',
    timestamps: true
  });

  Issue.associate = (models) => {
    // Atanan kullanıcı
    Issue.belongsTo(models.User, {
      foreignKey: 'assigneeId',
      as: 'assignee'
    });

    // Görevi oluşturan kullanıcı
    Issue.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    // Proje ilişkisi (Project üzerinden projectMembers ile ilişki kurmak mümkün)
    Issue.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });

    // Yorumlar
    Issue.hasMany(models.Comment, {
      foreignKey: 'issueId',
      as: 'comments'
    });
  };

  return Issue;
};
