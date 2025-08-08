'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.createTable('Projects', {
    id:{
      type: Sequelize.INTEGER,   // Tamsayı türünde
      autoIncrement: true,       // Her proje için bir artar
      primaryKey: true           // Tablo içinde benzersiz tanımlayıcı
    },
    name: {
      type: Sequelize.STRING,    // Metin türünde
      allowNull: false           // Zorunlu alan
    },
    description: {
      type: Sequelize.TEXT,      // Metin türünde
      allowNull: true            // Opsiyonel alan
    },
    createdBy: {
  type: Sequelize.INTEGER,
  allowNull: false,  // ❗️Bu satırı mutlaka ekle
  references: {
    model: 'Users',
    key: 'id'
  },
  onDelete: 'CASCADE'  // Kullanıcı silinirse, projeleri de silinsin
},

    createdAt: {
      type: Sequelize.DATE,      // Tarih-zaman bilgisi
      allowNull: false           // Zorunlu alan
    },
    updatedAt: {
      type: Sequelize.DATE,      // Tarih-zaman bilgisi
      allowNull: false           // Zorunlu alan
    },
    startDate: { type: Sequelize.DATE, allowNull: true },
    endDate: { type: Sequelize.DATE, allowNull: true },


  });
},
async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Projects'); // Tabloyu kaldırır
}
};
