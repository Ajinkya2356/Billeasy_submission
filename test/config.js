// Test environment settings
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/book_review_api_test';
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_EXPIRE = '1h';

const mongoose = require('mongoose');

// Function to disconnect from MongoDB
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB disconnected');
    }
  } catch (err) {
    console.error('Error disconnecting from MongoDB:', err);
    process.exit(1);
  }
};

// Export disconnect function
module.exports = {
  disconnectDB
};