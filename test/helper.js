// Import test configuration
const { disconnectDB } = require('./config');

const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const Book = require('../src/models/book.model');
const Review = require('../src/models/review.model');

// Clean up database before tests
const clearDatabase = async () => {
  try {
    await mongoose.connection.dropDatabase();
  } catch (err) {
    console.error('Error clearing database:', err);
  }
};

// Create test user and return token
const getToken = async () => {
  // Create a test user
  const testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  // Generate token
  return testUser.getSignedJwtToken();
};

// Create a test book
const createTestBook = async (userId) => {
  return await Book.create({
    title: 'Test Book',
    author: 'Test Author',
    description: 'Test Description',
    genre: 'Fiction',
    publicationYear: 2023,
    user: userId
  });
};

module.exports = {
  clearDatabase,
  getToken,
  createTestBook,
  disconnectDB
};