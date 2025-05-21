const express = require('express');
const { createBook, getBooks, getBook } = require('../controllers/book.controller');
const { addReview } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Book routes
router.route('/')
  .get(getBooks)
  .post(protect, createBook);

router.route('/:id')
  .get(getBook);

// Book review routes
router.route('/:id/reviews')
  .post(protect, addReview);

module.exports = router;