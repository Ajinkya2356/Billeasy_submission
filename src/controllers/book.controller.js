const Book = require('../models/book.model');
const Review = require('../models/review.model');

// @desc    Create new book
// @route   POST /api/books
// @access  Private
exports.createBook = async (req, res) => {
  try {
    // Add user to request body
    req.body.user = req.user.id;

    const book = await Book.create(req.body);

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get all books
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Book.find(JSON.parse(queryStr));

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Book.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const books = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
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

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Pagination for reviews
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get reviews for this book with pagination
    const reviews = await Review.find({ book: req.params.id })
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit)
      .populate({
        path: 'user',
        select: 'name'
      });
    
    const reviewCount = await Review.countDocuments({ book: req.params.id });
    
    // Pagination info
    const pagination = {};
    if (startIndex + limit < reviewCount) {
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
      data: book,
      reviews,
      reviewCount,
      pagination
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};