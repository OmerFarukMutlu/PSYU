'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.addIndex('Users', ['email'], {
  name: 'users_email_index',
  unique: true
});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'users_email_index');

  }
};
