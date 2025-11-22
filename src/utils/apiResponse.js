exports.successResponse = (message, data = null) => {
  return {
    success: true,
    message,
    data
  };
};

exports.errorResponse = (message, errors = null) => {
  return {
    success: false,
    message,
    errors
  };
};