const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_DB_URI;
  if (!uri) throw new Error('MONGODB_DB_URI is not set in environment variables');

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || 'sektion',
    });
    isConnected = true;
    console.log('✅ MongoDB connected');

    mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('MongoDB disconnected. Reconnecting...');
      setTimeout(connectDB, 5000);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    isConnected = false;
    throw err; // Let caller handle — never call process.exit() in serverless
  }
};

module.exports = connectDB;
