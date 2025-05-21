const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  // Check if auth header exists and has Bearer token
  if (
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to request
    req.user = await User.findById(decoded.id);
    
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }
};