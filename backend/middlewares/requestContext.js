"use strict";

const crypto = require("crypto");

function requestContext(req, res, next) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  const startedAt = process.hrtime.bigint();

  req.id = String(requestId);
  req.startedAt = startedAt;
  res.setHeader("X-Request-Id", req.id);

  next();
}

module.exports = requestContext;
