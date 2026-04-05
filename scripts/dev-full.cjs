const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");

const ROOT_DIR = path.resolve(__dirname, "..");
const FRONTEND_DIR = path.join(ROOT_DIR, "catalog-projeto");

function run(label, command, args, cwd) {
  let child;
  try {
    child = spawn(command, args, {
      shell: false,
      stdio: "inherit",
      env: process.env,
      cwd,
    });
  } catch (err) {
    throw new Error(`[${label}] falha ao iniciar: ${err.message}`);
  }

  child.on("error", (err) => {
    console.error(`[${label}] erro ao iniciar processo:`, err.message);
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${label}] encerrado com código ${code}`);
    }
  });

  return child;
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        resolve(true);
        return;
      }
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(false));
    });

    server.listen(port, "127.0.0.1");
  });
}

async function main() {
  const processes = [];
  const apiPort = Number(process.env.PORT || 3000);

  console.log("[dev:full] Iniciando frontend (Vite) como principal...");

  const web = run(
    "web",
    process.execPath,
    ["./node_modules/vite/bin/vite.js"],
    FRONTEND_DIR
  );
  processes.push(web);

  const portBusy = await isPortInUse(apiPort);
  if (portBusy) {
    console.log(`[dev:full] API já está ativa na porta ${apiPort}. Mantendo Vite como principal.`);
  } else {
    console.log(`[dev:full] Iniciando API na porta ${apiPort}...`);
    const api = run(
      "api",
      process.execPath,
      ["./node_modules/nodemon/bin/nodemon.js", "server.js"],
      ROOT_DIR
    );
    processes.push(api);
  }

  function shutdown() {
    processes.forEach((proc) => {
      if (proc && !proc.killed) proc.kill();
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Falha ao iniciar dev:full", err);
  process.exit(1);
});
