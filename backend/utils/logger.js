// backend/utils/logger.js
//
// Logger centralizado e simples.
// Em produção: emite JSON estruturado (facilita integração com Datadog, Logtail etc).
// Em desenvolvimento: texto legível com ícones e timestamps.

"use strict";

const isProduction = process.env.NODE_ENV === "production";

function now() {
  return new Date().toISOString();
}

function build(level, message, meta) {
  if (isProduction) {
    const payload = { ts: now(), level, message };
    if (meta && Object.keys(meta).length) Object.assign(payload, meta);
    return JSON.stringify(payload);
  }

  const icons = { info: "ℹ️ ", warn: "⚠️ ", error: "✖  ", debug: "◉  " };
  const icon = icons[level] ?? level.toUpperCase();
  const metaStr =
    meta && Object.keys(meta).length
      ? " " + JSON.stringify(meta)
      : "";
  return `[${now()}] ${icon} ${message}${metaStr}`;
}

const logger = {
  info:  (msg, meta = {}) => console.log(build("info",  msg, meta)),
  warn:  (msg, meta = {}) => console.warn(build("warn",  msg, meta)),
  error: (msg, meta = {}) => console.error(build("error", msg, meta)),
  debug: (msg, meta = {}) => { if (!isProduction) console.log(build("debug", msg, meta)); },
};

module.exports = logger;
