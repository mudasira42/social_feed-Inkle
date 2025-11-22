const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(error => error.message);
    return res.status(400).json(errorResponse(messages.join(', ')));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json(errorResponse(`${field} already exists`));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Invalid token'));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token expired'));
  }

  // Default error
  res.status(err.statusCode || 500).json(
    errorResponse(err.message || 'Server Error')
  );
};

module.exports = errorHandler;