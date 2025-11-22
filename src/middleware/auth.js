const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json(errorResponse('Not authorized, no token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json(errorResponse('User not found'));
    }

    if (!req.user.isActive) {
      return res.status(401).json(errorResponse('User account is deactivated'));
    }

    next();
  } catch (error) {
    return res.status(401).json(errorResponse('Not authorized, token failed'));
  }
};