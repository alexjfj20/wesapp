'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Import configuration
let config;
try {
  config = require('../config/database.js')[env];
  console.log('Using database config for environment:', env);
} catch (err) {
  console.error('Error loading database config:', err.message);
  console.log('Using default SQLite configuration');
  
  // Default SQLite config if no config file is found
  config = {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false
  };
}

// Initialize Sequelize with fallback handling
let sequelize;
try {
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(
      config.database, 
      config.username, 
      config.password, 
      config
    );
  }
} catch (err) {
  console.error('Failed to initialize primary database:', err.message);
  
  if (config.fallback) {
    console.log('Attempting to use fallback database configuration');
    try {
      sequelize = new Sequelize(config.fallback);
      console.log('Connected using fallback database configuration');
    } catch (fallbackErr) {
      console.error('Failed to initialize fallback database:', fallbackErr.message);
      throw new Error('Could not connect to any database');
    }
  } else {
    throw new Error('No fallback database configuration provided');
  }
}

const db = {};

// Read all model files and import them
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      !file.includes('-test') &&
      !file.includes('.test') &&
      !file.includes('index-')
    );
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize);
      if (model && model.name) {
        db[model.name] = model;
        console.log('Model loaded:', model.name);
      } else {
        console.warn('Model in file', file, 'did not return a valid model');
      }
    } catch (err) {
      console.error('Error loading model', file + ':', err.message);
    }
  });

// Set up associations between models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
    } catch (err) {
      console.error('Error setting up associations for', modelName + ':', err.message);
    }
  }
});

// Add sequelize instance and Sequelize class to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err.message);
  });

module.exports = db;
