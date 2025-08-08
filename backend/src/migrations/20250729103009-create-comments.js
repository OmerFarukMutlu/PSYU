'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Comments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'Yorumun benzersiz ID’si'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Yorum içeriği boş bırakılamaz'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'İsteğe bağlı ek JSON veri'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Yorumu yazan kullanıcı'
      },
      issueId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Issues',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Yorumun ait olduğu görev/sorun'
      },
      isEdited: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Yorum düzenlendiyse true olacak'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Yorumun oluşturulma zamanı'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Yorumun son güncellenme zamanı'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Comments');
  }
};
