import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function startService(label, args) {
  const child = spawn("npm", args, {
    cwd: repoRoot,
    stdio: "pipe",
    shell: true,
    env: process.env,
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${label}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${label}] ${chunk}`);
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      process.stderr.write(`[${label}] exited with code ${code}\n`);
    }
  });

  return child;
}

const backend = startService("backend", ["run", "dashboard:backend"]);
const frontend = startService("frontend", ["run", "dashboard:frontend"]);

let isShuttingDown = false;

function stopAll(reason, exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  process.stdout.write(`\n${reason}\n`);
  backend.kill("SIGINT");
  frontend.kill("SIGINT");
  setTimeout(() => {
    process.exit(exitCode);
  }, 150);
}

backend.on("exit", (code) => {
  if (isShuttingDown) return;
  if (code !== 0) {
    stopAll("Backend exited unexpectedly. Stopping frontend.", 1);
  }
});

frontend.on("exit", (code) => {
  if (isShuttingDown) return;
  if (code !== 0) {
    stopAll("Frontend exited unexpectedly. Stopping backend.", 1);
  }
});

function shutdown(signal) {
  stopAll(`Received ${signal}. Stopping dashboard services...`, 0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
