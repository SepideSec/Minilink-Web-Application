const { Sequelize } = require('sequelize');

// Example: MySQL connection
const sequelize = new Sequelize('sqlite::memory:');

module.exports = sequelize;