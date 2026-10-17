/**
 * Local PostgreSQL for development.
 *
 * Uses the `embedded-postgres` binary distribution (shipped through npm, no
 * Docker or system install required) but drives it through `pg_ctl` so the
 * server runs as a detached, persistent process that survives this script.
 * Data lives in .pgdata/. Production should point DATABASE_URL at a managed
 * PostgreSQL instead.
 *
 *   npm run db:start    initialise (first run) + start + create the database
 *   npm run db:stop     stop the server
 *   npm run db:status   show status
 */
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile, unlink, readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const DATA_DIR = path.resolve(".pgdata");
const PORT = Number(process.env.PGPORT ?? 5433);
const USER = process.env.PGUSER ?? "postgres";
const PASSWORD = process.env.PGPASSWORD ?? "postgres";
const DB = process.env.PGDATABASE ?? "tima_birthday";
const LOG_FILE = path.join(DATA_DIR, "server.log");

/** Resolves the platform binary package the same way embedded-postgres does. */
async function loadBinaries() {
  const platform = os.platform();
  const arch = os.arch();
  const map = {
    "darwin-arm64": "@embedded-postgres/darwin-arm64",
    "darwin-x64": "@embedded-postgres/darwin-x64",
    "linux-arm64": "@embedded-postgres/linux-arm64",
    "linux-arm": "@embedded-postgres/linux-arm",
    "linux-ia32": "@embedded-postgres/linux-ia32",
    "linux-ppc64": "@embedded-postgres/linux-ppc64",
    "linux-x64": "@embedded-postgres/linux-x64",
    "win32-x64": "@embedded-postgres/windows-x64",
  };
  const pkg = map[`${platform}-${arch}`];
  if (!pkg) throw new Error(`Unsupported platform "${platform}-${arch}".`);
  return import(pkg);
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "pipe", ...options });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr?.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", (error) => resolve({ code: -1, stdout, stderr: String(error) }));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    // `pg_ctl start` detaches the server, which inherits our pipes and can keep
    // them open. Never block forever waiting for a close event.
    const timer = setTimeout(() => resolve({ code: 0, stdout, stderr }), 30000);
    child.on("close", () => clearTimeout(timer));
  });
}

/** Runs a command with the pipes fully detached (for `pg_ctl start`). */
function runDetached(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    child.on("error", () => resolve(-1));
    child.on("close", (code) => resolve(code ?? 0));
    child.unref();
    setTimeout(() => resolve(0), 30000);
  });
}

async function connectPg() {
  const { Client } = require("pg");
  const client = new Client({
    user: USER,
    password: PASSWORD,
    host: "localhost",
    port: PORT,
    database: "postgres",
  });
  await client.connect();
  return client;
}

async function isRunning() {
  try {
    const client = await connectPg();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

async function initialise(initdb) {
  mkdirSync(DATA_DIR, { recursive: true });
  const passwordFile = path.join(os.tmpdir(), `pg-password-${Date.now()}`);
  await writeFile(passwordFile, `${PASSWORD}\n`);
  try {
    const result = await run(initdb, [
      `--pgdata=${DATA_DIR}`,
      `--auth=password`,
      `--username=${USER}`,
      `--pwfile=${passwordFile}`,
      `--encoding=UTF8`,
      `--locale=C`,
    ]);
    if (result.code !== 0) {
      throw new Error(`initdb failed:\n${result.stdout}\n${result.stderr}`);
    }
  } finally {
    await unlink(passwordFile).catch(() => {});
  }
}

async function start() {
  const { pg_ctl, initdb } = await loadBinaries();

  if (await isRunning()) {
    console.log(`PostgreSQL already running on port ${PORT}.`);
  } else {
    if (!existsSync(path.join(DATA_DIR, "PG_VERSION"))) {
      console.log("Initialising PostgreSQL data directory...");
      await initialise(initdb);
    }
    console.log(`Starting PostgreSQL on port ${PORT}...`);
    const code = await runDetached(pg_ctl, [
      "start",
      "-D",
      DATA_DIR,
      "-l",
      LOG_FILE,
      "-o",
      `-p ${PORT} -c shared_buffers=32MB -c max_connections=20 -c logging_collector=off -c huge_pages=off`,
      "-w",
    ]);
    if (code !== 0) {
      const log = await readFile(LOG_FILE, "utf-8").catch(() => "");
      throw new Error(`pg_ctl start failed (exit ${code}):\n${log}`);
    }

    for (let i = 0; i < 30; i++) {
      if (await isRunning()) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const client = await connectPg();
  try {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB]);
    if (exists.rowCount === 0) {
      console.log(`Creating database "${DB}"...`);
      await client.query(`CREATE DATABASE "${DB}"`);
    }
  } finally {
    await client.end();
  }

  console.log(`PostgreSQL ready -> postgresql://${USER}:***@localhost:${PORT}/${DB}`);
}

async function stop() {
  const { pg_ctl } = await loadBinaries();
  const result = await run(pg_ctl, ["stop", "-D", DATA_DIR, "-m", "fast", "-w"]);
  if (result.code !== 0) {
    console.log("PostgreSQL is not running.");
    return;
  }
  console.log("PostgreSQL stopped.");
}

async function status() {
  const running = await isRunning();
  console.log(`PostgreSQL on port ${PORT}: ${running ? "RUNNING" : "STOPPED"}`);
  if (running) {
    const client = await connectPg();
    try {
      const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB]);
      console.log(`  database "${DB}": ${exists.rowCount > 0 ? "present" : "MISSING"}`);
    } finally {
      await client.end();
    }
  }
}

const cmd = process.argv[2] ?? "start";
try {
  if (cmd === "start") await start();
  else if (cmd === "stop") await stop();
  else if (cmd === "status") await status();
  else {
    console.error(`Unknown command "${cmd}". Use start | stop | status.`);
    process.exit(1);
  }
} catch (error) {
  console.error("PostgreSQL command failed:", error?.message ?? error);
  process.exit(1);
}
