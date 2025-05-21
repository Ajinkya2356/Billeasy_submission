const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

// Import models, server and helper
const app = require('../src/server');
const connectDB = require('../src/config/db');
const User = require('../src/models/user.model');
const Book = require('../src/models/book.model');
const { clearDatabase, disconnectDB } = require('./helper');

// Middleware
chai.use(chaiHttp);

describe('Search API', () => {
  let userId;

  before(async () => {
    // Disconnect any existing connection first
    await disconnectDB();
    // Connect to test database
    await connectDB();
    
    // Create a test user
    const user = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    userId = user._id;
  });

  // Disconnect after all tests
  after(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    // Create test books with different titles and authors
    await Book.create([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'A novel about the American Dream',
        genre: 'Fiction',
        publicationYear: 1925,
        user: userId
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'A novel about racial injustice',
        genre: 'Fiction',
        publicationYear: 1960,
        user: userId
      },
      {
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian novel',
        genre: 'Science Fiction',
        publicationYear: 1949,
        user: userId
      },
      {
        title: 'The Great Expectations',
        author: 'Charles Dickens',
        description: 'A coming-of-age novel',
        genre: 'Fiction',
        publicationYear: 1861,
        user: userId
      },
    ]);
  });

  // Clear database after each test
  afterEach(async () => {
    await Book.deleteMany({});
  });

  // Test search endpoint
  describe('GET /api/search', () => {
    it('should return books matching title search query', async () => {
      const res = await chai.request(app)
        .get('/api/search?query=great');

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data').to.be.an('array');
      expect(res.body.data.length).to.be.at.least(2);
      
      // Check if returned books contain 'great' in the title
      const titles = res.body.data.map(book => book.title.toLowerCase());
      titles.forEach(title => {
        expect(title).to.include('great');
      });
    });

    it('should return books matching author search query', async () => {
      const res = await chai.request(app)
        .get('/api/search?query=orwell');

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data').to.be.an('array');
      expect(res.body.data.length).to.equal(1);
      expect(res.body.data[0].author.toLowerCase()).to.include('orwell');
    });

    it('should return empty array for search with no matches', async () => {
      const res = await chai.request(app)
        .get('/api/search?query=nonexistentbook');

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data').to.be.an('array');
      expect(res.body.data).to.have.lengthOf(0);
    });

    it('should return error when no query is provided', async () => {
      const res = await chai.request(app)
        .get('/api/search');

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message').that.includes('provide a search query');
    });

    it('should return paginated results', async () => {
      const res = await chai.request(app)
        .get('/api/search?query=the&page=1&limit=1');

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data').to.be.an('array');
      expect(res.body.data).to.have.lengthOf(1);
      expect(res.body).to.have.property('pagination');
      expect(res.body.pagination).to.have.property('next');
    });
  });
});