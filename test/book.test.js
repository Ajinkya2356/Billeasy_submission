const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const expect = chai.expect;

// Import models, server and helper
const app = require('../src/server');
const connectDB = require('../src/config/db');
const User = require('../src/models/user.model');
const Book = require('../src/models/book.model');
const { clearDatabase, getToken, disconnectDB } = require('./helper');

// Middleware
chai.use(chaiHttp);

describe('Book API', () => {
  let token;
  let userId;

  before(async () => {
    // Disconnect any existing connection first
    await disconnectDB();
    // Connect to test database
    await connectDB();
    
    // Create a test user and get token
    const user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    userId = user._id;
    token = user.getSignedJwtToken();
  });

  // Clear database after each test
  afterEach(async () => {
    await Book.deleteMany({});
  });

  // Disconnect after all tests
  after(async () => {
    await disconnectDB();
  });

  // Test creating a book
  describe('POST /api/books', () => {
    it('should create a new book when authenticated', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        genre: 'Fiction',
        publicationYear: 2023
      };

      const res = await chai.request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${token}`)
        .send(bookData);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('title', bookData.title);
      expect(res.body.data).to.have.property('author', bookData.author);
      expect(res.body.data).to.have.property('user', userId.toString());
    });

    it('should not create a book without authentication', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        description: 'Test Description',
        genre: 'Fiction',
        publicationYear: 2023
      };

      const res = await chai.request(app)
        .post('/api/books')
        .send(bookData);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should not create a book with missing required fields', async () => {
      const bookData = {
        title: 'Test Book',
        // Missing author and description
        genre: 'Fiction',
        publicationYear: 2023
      };

      const res = await chai.request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${token}`)
        .send(bookData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Test getting all books
  describe('GET /api/books', () => {
    beforeEach(async () => {
      // Create some test books
      await Book.create([
        {
          title: 'Book 1',
          author: 'Author 1',
          description: 'Description 1',
          genre: 'Fiction',
          publicationYear: 2021,
          user: userId
        },
        {
          title: 'Book 2',
          author: 'Author 2',
          description: 'Description 2',
          genre: 'Science Fiction',
          publicationYear: 2022,
          user: userId
        },
        {
          title: 'Book 3',
          author: 'Author 3',
          description: 'Description 3',
          genre: 'Mystery',
          publicationYear: 2023,
          user: userId
        }
      ]);
    });

    it('should get all books with pagination', async () => {
      const res = await chai.request(app)
        .get('/api/books?page=1&limit=2');

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('count', 2); // Limit is 2
      expect(res.body).to.have.property('data').to.be.an('array').with.lengthOf(2);
      expect(res.body).to.have.property('pagination');
      expect(res.body.pagination).to.have.property('next');
    });

    it('should filter books by genre', async () => {
      const res = await chai.request(app)
        .get('/api/books?genre=Fiction');

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data').to.be.an('array');
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body.data[0]).to.have.property('genre', 'Fiction');
    });
  });

  // Test getting a single book
  describe('GET /api/books/:id', () => {
    let bookId;

    beforeEach(async () => {
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
    });

    it('should get a book by ID', async () => {
      const res = await chai.request(app)
        .get(`/api/books/${bookId}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('title', 'Test Book');
      expect(res.body.data).to.have.property('author', 'Test Author');
      expect(res.body.data).to.have.property('_id', bookId.toString());
    });

    it('should return 404 for non-existent book ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await chai.request(app)
        .get(`/api/books/${fakeId}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Book not found');
    });

    it('should return 400 for invalid book ID format', async () => {
      const res = await chai.request(app)
        .get('/api/books/invalidid');

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
    });
  });
});