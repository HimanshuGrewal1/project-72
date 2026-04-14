const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  ip_address: {
    type: DataTypes.STRING,
  },
  user_agent: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'sessions',
  timestamps: true,
  underscored: true,
});

module.exports = Session;