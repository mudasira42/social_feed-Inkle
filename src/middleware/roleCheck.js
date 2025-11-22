const { errorResponse } = require('../utils/apiResponse');

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse(`User role '${req.user.role}' is not authorized to access this route`)
      );
    }
    next();
  };
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json(
      errorResponse('Access denied. Admin privileges required.')
    );
  }
  next();
};

exports.isOwner = (req, res, next) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json(
      errorResponse('Access denied. Owner privileges required.')
    );
  }
  next();
};