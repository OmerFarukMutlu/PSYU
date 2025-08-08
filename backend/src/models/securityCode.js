// models/securityCode.js
module.exports = (sequelize, DataTypes) => {
  const SecurityCode = sequelize.define(
    'SecurityCode',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true // ✅ Her kullanıcıya 1 güvenlik kodu
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: 'security_codes',
      timestamps: true,
      underscored: true // ✅ created_at, updated_at formatı
    }
  );

  // İlişkilendirme
  SecurityCode.associate = (models) => {
    SecurityCode.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return SecurityCode;
};
