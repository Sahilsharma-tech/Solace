const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  try {
    // Validate MongoDB URI
    if (!config.database.uri) {
      console.error('❌ MONGODB_URI is not configured in environment variables');
      throw new Error('MONGODB_URI is not configured');
    }

    const conn = await mongoose.connect(config.database.uri);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't exit process in serverless environments
    // Just throw the error to be handled by the caller
    throw error;
  }
};

module.exports = connectDB;
