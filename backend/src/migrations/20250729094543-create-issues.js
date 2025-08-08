'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.createTable('Issues', {
    id: { 
      type: Sequelize.INTEGER, // Sorunun benzersiz ID'si
      autoIncrement: true, // Her sorun için bir artar
      primaryKey: true // Tablo içinde benzersiz tanımlayıcı
    },
    title: {
      type: Sequelize.STRING, // Sorunun başlığı
      allowNull: false // Başlık boş olamaz
    },
    description: {
      type: Sequelize.TEXT, // Sorunun detaylı açıklaması
      allowNull: true // Açıklama isteğe bağlı olabilir
    },
    status: {
      type: Sequelize.ENUM(
        'todo', // Görev henüz yapılmamış
        'in_progress', // Görev yapılıyor
        'done', // Görev tamamlandı
        'blocked' // Görev engellendi
      ),
      defaultValue: 'todo', // Varsayılan durum "todo"
      allowNull: false // Durum boş olamaz
    },
    priority: {
      type: Sequelize.ENUM(
        'low', // Düşük öncelik
        'medium', // Orta öncelik
        'high' // Yüksek öncelik
      ),
      defaultValue: 'medium', // Varsayılan öncelik "medium"
      allowNull: false // Öncelik boş olamaz
    },
    assigneeId: {
      type: Sequelize.INTEGER, // Atanan kullanıcının ID'si
      allowNull: true, // Atama isteğe bağlı olabilir
      references: {
        model: 'Users', // Kullanıcılar tablosuna referans
        key: 'id' // Kullanıcı ID'si ile ilişkilendirilecek
      },
      onUpdate: 'CASCADE', // Kullanıcı güncellenirse, atama da güncellenecek
      onDelete: 'SET NULL' // Kullanıcı silinirse, atama null olacak
    },
    projectId: {
      type: Sequelize.INTEGER, // Proje ID'si
      allowNull: false, // Proje boş olamaz
      references: {
        model: 'Projects', // Projeler tablosuna referans
        key: 'id' // Proje ID'si ile ilişkilendirilecek
      },
      onUpdate: 'CASCADE', // Proje güncellenirse, sorun da güncellenecek
      onDelete: 'CASCADE' // Proje silinirse, sorun da silinecek
    },
    createdAt: {
      type: Sequelize.DATE, // Oluşturulma tarihi
      allowNull: false // Tarih boş olamaz
    },
    updatedAt: {
      type: Sequelize.DATE, // Güncellenme tarihi
      allowNull: false // Tarih boş olamaz
    },
    dueDate: { type: Sequelize.DATE, allowNull: true }

  });
  },
  async down (queryInterface, Sequelize) {
    // Sorunlar tablosunu siler
    await queryInterface.dropTable('Issues');
  }
};
