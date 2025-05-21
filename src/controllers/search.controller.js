const Book = require('../models/book.model');

// @desc    Search books by title or author
// @route   GET /api/search
// @access  Public
exports.searchBooks = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Create search regex (case insensitive)
    const searchRegex = new RegExp(query, 'i');
    
    // Find books that match either title or author
    const books = await Book.find({
      $or: [
        { title: searchRegex },
        { author: searchRegex }
      ]
    })
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');
    
    // Get total count for pagination
    const count = await Book.countDocuments({
      $or: [
        { title: searchRegex },
        { author: searchRegex }
      ]
    });
    
    // Pagination result
    const pagination = {};

    if (startIndex + limit < count) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: books.length,
      pagination,
      data: books
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};