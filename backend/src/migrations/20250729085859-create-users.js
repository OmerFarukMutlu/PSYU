'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      fullname: {
        type: Sequelize.STRING,
        allowNull: false
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false
      },

      role: {
        type: Sequelize.ENUM(
          'admin',
          'admin_helper',     // ✅ Eksik rol eklendi
          'project_manager',
          'team_lead',
          'developer',
          'client',
          'user'              // ✅ Eksik rol eklendi
        ),
        defaultValue: 'user'
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },

      isMainAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // ENUM'u kaldırmak için önce tabloyu silmek gerekir
    await queryInterface.dropTable('Users');
  }
};
