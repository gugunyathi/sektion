// Vercel serverless function — exports Express app
// Route: /api/*
// NOTE: Do NOT load dotenv here — Vercel injects env vars directly at runtime.
// dotenv only reads from a file, which doesn't exist in Vercel's serverless environment.

const app = require('../server/index.js');

module.exports = app;
