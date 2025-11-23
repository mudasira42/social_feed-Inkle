const { errorResponse } = require('../utils/apiResponse');

// Normalize roles to UPPERCASE
function normalize(role) {
  if (!role) return '';
  return role.toString().trim().toUpperCase();
}

// Generic role authorization
exports.authorize = (...roles) => {
  // Convert allowed roles to uppercase
  roles = roles.map(r => r.toUpperCase());

  return (req, res, next) => {
    const userRole = normalize(req.user.role);

    if (!roles.includes(userRole)) {
      return res.status(403).json(
        errorResponse(`User role '${req.user.role}' is not authorized to access this route`)
      );
    }
    next();
  };
};

// Admin OR Owner
exports.isAdmin = (req, res, next) => {
  const role = normalize(req.user.role);

  if (role !== 'ADMIN' && role !== 'OWNER') {
    return res.status(403).json(
      errorResponse('Access denied. Admin privileges required.')
    );
  }

  next();
};

// Owner only
exports.isOwner = (req, res, next) => {
  const role = normalize(req.user.role);

  if (role !== 'OWNER') {
    return res.status(403).json(
      errorResponse('Access denied. Owner privileges required.')
    );
  }

  next();
};
