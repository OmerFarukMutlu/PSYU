'use strict';

module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Projects',
    timestamps: true,
    paranoid: true
  });

  // 🔁 İlişkiler
  Project.associate = function(models) {
    Project.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    Project.belongsToMany(models.User, {
      through: models.ProjectMember,
      foreignKey: 'projectId',
      as: 'members'
    });

    Project.hasMany(models.ProjectMember, {
      foreignKey: 'projectId',
      as: 'projectMembers'
    });

    Project.hasMany(models.Issue, {
      foreignKey: 'projectId',
      as: 'issues'
    });
  };

  return Project;
};
