module.exports = function isAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      status: "error",
      code: "NOT_AUTHENTICATED",
      message: "Not authenticated"
    });
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      code: "ACCESS_DENIED",
      message: "Access denied"
    });
  }

  next();
};