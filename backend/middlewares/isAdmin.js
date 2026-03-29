const AppError = require("../utils/AppError");

module.exports = function isAdmin(req, res, next) {
  if (!req.session.user) {
    return next(new AppError("Não autenticado", 401, "NOT_AUTHENTICATED"));
  }

  if (req.session.user.role !== "admin") {
    return next(new AppError("Acesso negado", 403, "ACCESS_DENIED"));
  }

  next();
};