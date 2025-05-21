const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const expect = chai.expect;

// Import models, server and helper
const app = require('../src/server');
const connectDB = require('../src/config/db');
const User = require('../src/models/user.model');
const Book = require('../src/models/book.model');
const Review = require('../src/models/review.model');
const { clearDatabase, disconnectDB } = require('./helper');

// Middleware
chai.use(chaiHttp);

describe('Review API', () => {
  let token, secondUserToken;
  let userId, secondUserId;
  let bookId;
  let reviewId;

  before(async () => {
    // Disconnect any existing connection first
    await disconnectDB();
    // Connect to test database
    await connectDB();
  });

  // Disconnect after all tests
  after(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Create test users
    const user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    const secondUser = await User.create({
      name: 'Second User',
      email: 'seconduser@example.com',
      password: 'password123'
    });
    
    userId = user._id;
    secondUserId = secondUser._id;
    token = user.getSignedJwtToken();
    secondUserToken = secondUser.getSignedJwtToken();
    
    // Create a test book
    const book = await Book.create({
      title: 'Test Book',
      author: 'Test Author',
      description: 'Test Description',
      genre: 'Fiction',
      publicationYear: 2023,
      user: userId
    });
    
    bookId = book._id;
    
    // Create a test review
    const review = await Review.create({
      title: 'Test Review',
      text: 'This is a test review',
      rating: 4,
      book: bookId,
      user: userId
    });
    
    reviewId = review._id;
  });

  // Clear database after each test
  afterEach(async () => {
    await clearDatabase();
  });

  // Test creating a review
  describe('POST /api/books/:id/reviews', () => {
    it('should create a new review when authenticated', async () => {
      // Using second user since the first user already has a review
      const reviewData = {
        title: 'Great Book',
        text: 'I really enjoyed reading this book',
        rating: 5
      };

      const res = await chai.request(app)
        .post(`/api/books/${bookId}/reviews`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send(reviewData);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('title', reviewData.title);
      expect(res.body.data).to.have.property('text', reviewData.text);
      expect(res.body.data).to.have.property('rating', reviewData.rating);
      expect(res.body.data).to.have.property('user', secondUserId.toString());
      expect(res.body.data).to.have.property('book', bookId.toString());
    });

    it('should not create a review without authentication', async () => {
      const reviewData = {
        title: 'Great Book',
        text: 'I really enjoyed reading this book',
        rating: 5
      };

      const res = await chai.request(app)
        .post(`/api/books/${bookId}/reviews`)
        .send(reviewData);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should not allow a user to submit multiple reviews for the same book', async () => {
      const reviewData = {
        title: 'Another Review',
        text: 'Trying to add another review',
        rating: 3
      };

      const res = await chai.request(app)
        .post(`/api/books/${bookId}/reviews`)
        .set('Authorization', `Bearer ${token}`) // First user already has a review
        .send(reviewData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message').that.includes('already submitted a review');
    });
  });

  // Test updating a review
  describe('PUT /api/reviews/:id', () => {
    it('should update a review when the user owns it', async () => {
      const updateData = {
        title: 'Updated Review Title',
        text: 'Updated review text',
        rating: 5
      };

      const res = await chai.request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('title', updateData.title);
      expect(res.body.data).to.have.property('text', updateData.text);
      expect(res.body.data).to.have.property('rating', updateData.rating);
    });

    it('should not allow a user to update another user\'s review', async () => {
      const updateData = {
        title: 'Unauthorized Update',
        text: 'Trying to update someone else\'s review',
        rating: 1
      };

      const res = await chai.request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${secondUserToken}`) // Different user
        .send(updateData);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message').that.includes('Not authorized');
    });

    it('should return 404 for non-existent review ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        title: 'Update Fake Review',
        text: 'This review does not exist',
        rating: 3
      };

      const res = await chai.request(app)
        .put(`/api/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Review not found');
    });
  });

  // Test deleting a review
  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review when the user owns it', async () => {
      const res = await chai.request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      
      // Verify review was deleted
      const reviewExists = await Review.findById(reviewId);
      expect(reviewExists).to.be.null;
    });

    it('should not allow a user to delete another user\'s review', async () => {
      const res = await chai.request(app)
        .delete(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${secondUserToken}`); // Different user

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message').that.includes('Not authorized');
    });

    it('should return 404 for non-existent review ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await chai.request(app)
        .delete(`/api/reviews/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Review not found');
    });
  });
});