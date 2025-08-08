module.exports = (sequelize, DataTypes) => {
  const ProjectMember = sequelize.define('ProjectMember', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    role: {
      type: DataTypes.ENUM('developer', 'tester', 'project_manager', 'team_lead'),
      allowNull: false,
      defaultValue: 'developer'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    tableName: 'ProjectMembers'
  });

  ProjectMember.associate = function(models) {
    // Kullanıcı ilişkisi
    ProjectMember.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Proje ilişkisi (tekil)
    ProjectMember.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
  };

  return ProjectMember;
};
