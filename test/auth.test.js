const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

// Import models, server and helper
const app = require('../src/server');
const connectDB = require('../src/config/db');
const User = require('../src/models/user.model');
const { clearDatabase, disconnectDB } = require('./helper');

// Middleware
chai.use(chaiHttp);

describe('Auth API', () => {
  before(async () => {
    // Disconnect any existing connection first
    await disconnectDB();
    // Connect to test database
    await connectDB();
  });

  // Clear database after each test
  afterEach(async () => {
    await clearDatabase();
  });

  // Disconnect after all tests
  after(async () => {
    await disconnectDB();
  });

  // Test signup
  describe('POST /api/signup', () => {
    it('should register a new user and return token', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const res = await chai.request(app)
        .post('/api/signup')
        .send(userData);

      expect(res).to.have.status(201);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('name', userData.name);
      expect(res.body.user).to.have.property('email', userData.email);
    });

    it('should not register a user with duplicate email', async () => {
      // Create a user first
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123'
      });

      // Try to create another user with the same email
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123'
      };

      const res = await chai.request(app)
        .post('/api/signup')
        .send(userData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message').that.includes('Email already registered');
    });

    it('should not register a user without required fields', async () => {
      const userData = {
        name: 'John Doe'
        // Missing email and password
      };

      const res = await chai.request(app)
        .post('/api/signup')
        .send(userData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
    });
  });

  // Test login
  describe('POST /api/login', () => {
    it('should login user and return token', async () => {
      // Create a user first
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const res = await chai.request(app)
        .post('/api/login')
        .send(loginData);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      expect(res.body).to.have.property('user');
      expect(res.body.user).to.have.property('name', 'John Doe');
      expect(res.body.user).to.have.property('email', loginData.email);
    });

    it('should not login with incorrect password', async () => {
      // Create a user first
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const res = await chai.request(app)
        .post('/api/login')
        .send(loginData);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const res = await chai.request(app)
        .post('/api/login')
        .send(loginData);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });
  });
});