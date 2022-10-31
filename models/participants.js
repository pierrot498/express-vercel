const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('participants', {
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bets: {
      type: DataTypes.JSON,
      allowNull: true
    }
    
  }, {
    sequelize,
    tableName: 'participants',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "participants_pkey",
        unique: true,
        fields: [
          { name: "address" },
        ]
      },
    ]
  });
};
