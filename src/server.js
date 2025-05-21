const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const reviewRoutes = require('./routes/review.routes');
const searchRoutes = require('./routes/search.routes');

// Initialize app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Book Review API' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;