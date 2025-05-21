const express = require('express');
const { searchBooks } = require('../controllers/search.controller');

const router = express.Router();

// Search routes
router.get('/', searchBooks);

module.exports = router;