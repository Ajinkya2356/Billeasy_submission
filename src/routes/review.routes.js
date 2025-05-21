const express = require('express');
const { updateReview, deleteReview } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Review routes
router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;