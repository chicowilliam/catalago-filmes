const AppError = require("../utils/AppError");

module.exports = function isAdmin(req, res, next) {
  if (!req.session.user) {
    return next(new AppError("Not authenticated", 401, "NOT_AUTHENTICATED"));
  }

  if (req.session.user.role !== "admin") {
    return next(new AppError("Access denied", 403, "ACCESS_DENIED"));
  }

  next();
};