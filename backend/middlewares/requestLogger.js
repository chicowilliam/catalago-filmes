"use strict";

const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const start = req.startedAt || end;
    const durationMs = Number(end - start) / 1_000_000;

    const meta = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error("request_failed", meta);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn("request_client_error", meta);
      return;
    }

    logger.info("request_completed", meta);
  });

  next();
}

module.exports = requestLogger;
