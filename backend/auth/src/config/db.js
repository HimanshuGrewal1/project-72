const { Sequelize } = require('sequelize');
const config = require('./index');

// sequelize.authenticate()
//   .then(() => console.log("Connected"))
//   .catch(err => console.error("Error:", err));
console.log('DB URL:', config.DB_URL); // Debugging line
const sequelize = new Sequelize(config.DB_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected');
    await sequelize.sync({ alter: true }); // use migrations in production
    console.log('Models synced');
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };