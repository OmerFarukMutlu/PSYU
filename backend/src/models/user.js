module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    fullname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(
        'admin',
        'admin_helper',
        'project_manager',
        'team_lead',
        'developer',
        'tester',
        'user'
      ),
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isMainAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'Users',
    timestamps: true
  });

  User.associate = function(models) {
    User.hasMany(models.Project, {
      foreignKey: 'createdBy',
      as: 'createdProjects'
    });

    User.hasMany(models.Issue, {
      foreignKey: 'assigneeId',
      as: 'assignedIssues'
    });

    User.hasMany(models.Comment, {
      foreignKey: 'userId',
      as: 'comments'
    });

    User.hasMany(models.IssueHistory, {
      foreignKey: 'changedBy',
      as: 'issueHistories'
    });

    User.belongsToMany(models.Project, {
      through: models.ProjectMember,
      foreignKey: 'userId',
      otherKey: 'projectId',
      as: 'memberProjects'
    });

    // ✅ Yeni eklenen ilişki: ProjectMember kayıtlarına erişim
    User.hasMany(models.ProjectMember, {
      foreignKey: 'userId',
      as: 'projectMemberships'
    });
  };

  return User;
};
