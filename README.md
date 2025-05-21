# Book Review API

A RESTful API for a book review system built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Create and manage books
- Add, update, and delete reviews
- Search books by title or author
- Pagination for books and reviews

## Tech Stack

- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Project Structure

```
book-review-api/
  ├── src/
  │   ├── config/       # Database configuration
  │   ├── controllers/  # Route controllers
  │   ├── middleware/   # Custom middleware
  │   ├── models/       # Mongoose models
  │   ├── routes/       # Express routes
  │   ├── utils/        # Utility functions
  │   └── server.js     # Express app setup
  ├── .env              # Environment variables
  ├── index.js          # Entry point
  └── package.json      # Project dependencies
```

## Database Schema

### User
- id: ObjectId
- name: String
- email: String (unique)
- password: String (hashed)
- createdAt: Date

### Book
- id: ObjectId
- title: String
- author: String
- description: String
- genre: String (enum)
- publicationYear: Number
- createdAt: Date
- user: ObjectId (reference to User)
- averageRating: Number (virtual)

### Review
- id: ObjectId
- title: String
- text: String
- rating: Number (1-5)
- createdAt: Date
- book: ObjectId (reference to Book)
- user: ObjectId (reference to User)

## Installation & Setup

1. Clone the repository
```
git clone https://github.com/yourusername/book-review-api.git
cd book-review-api
```

2. Install dependencies
```
npm install
```

3. Create a .env file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/book_review_api
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=24h
```

4. Start the server
- Development mode:
```
npm run dev
```
- Production mode:
```
npm start
```

## API Endpoints

### Authentication
- `POST /api/signup` - Register a new user
- `POST /api/login` - Authenticate user and get token

### Books
- `POST /api/books` - Create a new book (Auth required)
- `GET /api/books` - Get all books (with pagination)
- `GET /api/books/:id` - Get book details with reviews (with pagination)

### Reviews
- `POST /api/books/:id/reviews` - Add a review for a book (Auth required)
- `PUT /api/reviews/:id` - Update a review (Auth required, owner only)
- `DELETE /api/reviews/:id` - Delete a review (Auth required, owner only)

### Search
- `GET /api/search?query=keyword` - Search books by title or author

## Example API Requests

### Register a new user
```bash
curl -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Create a new book
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"The Great Book","author":"Author Name","description":"This is a great book","genre":"Fiction","publicationYear":2023}'
```

### Get all books with pagination
```bash
curl -X GET "http://localhost:3000/api/books?page=1&limit=10"
```

### Filter books by genre
```bash
curl -X GET "http://localhost:3000/api/books?genre=Fiction"
```

### Add a review
```bash
curl -X POST http://localhost:3000/api/books/BOOK_ID/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Great Read","text":"I really enjoyed this book","rating":5}'
```

### Search books
```bash
curl -X GET "http://localhost:3000/api/search?query=great"
```

## Design Decisions

1. **MongoDB**: Chosen for its flexibility with document data and ease of scaling.

2. **JWT Authentication**: Provides stateless authentication that works well with RESTful APIs.

3. **Review Restrictions**: Users can only submit one review per book to maintain data integrity.

4. **Pagination**: Implemented on book listings and reviews to handle large amounts of data efficiently.

5. **Case-Insensitive Search**: The search functionality is case-insensitive and works with partial matches for better user experience.
