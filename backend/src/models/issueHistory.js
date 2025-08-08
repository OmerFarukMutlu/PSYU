'use strict';

module.exports = (sequelize, DataTypes) => {
  const IssueHistory = sequelize.define('IssueHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    issueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Issues',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    changedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    field: {
      type: DataTypes.STRING,
      allowNull: false
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    changedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'IssueHistories',
    timestamps: true
  });

  // 🔁 İlişkiler
  IssueHistory.associate = function(models) {
    IssueHistory.belongsTo(models.Issue, {
      foreignKey: 'issueId',
      as: 'issue'
    });

    IssueHistory.belongsTo(models.User, {
      foreignKey: 'changedBy',
      as: 'user'
    });
  };

  return IssueHistory;
};
