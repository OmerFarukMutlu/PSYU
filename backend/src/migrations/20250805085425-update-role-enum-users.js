'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // PostgreSQL ENUM'a yeni değer ekleme
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role"
      ADD VALUE IF NOT EXISTS 'admin_helper'
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Users_role"
      ADD VALUE IF NOT EXISTS 'user'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // ENUM’dan değer silmek PostgreSQL'de kolay olmadığı için boş bırakıyoruz
  }
};
