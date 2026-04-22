// Vercel serverless function — exports Express app
// Route: /api/*

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = require('../server/index.js');

module.exports = app;
