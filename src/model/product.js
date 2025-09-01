const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbconfig');
const generateId = require('../service/idGenerator');

const productModel = sequelize.define('productModel', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    defaultValue: () => generateId.generateId()
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discount: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  view: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  like: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sell: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'db_product'
});

module.exports = productModel;