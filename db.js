const { Sequelize } = require('sequelize')

// Example: MySQL connection
const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: 'database.sqlite',
})

module.exports = sequelize;