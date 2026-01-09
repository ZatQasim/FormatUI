/**
 * keepalive.ts
 *
 * Single-file keepalive pinger (TypeScript).
 *
 * Purpose:
 * - Periodically send lightweight HTTP GET "pings" to one or more target URLs to help keep
 *   a hosting service (Render/Railway/Replit/etc.) from idling your Discord bot.
 *
 * Important:
 * - Use responsibly. Set a reasonable INTERVAL_SECONDS (>= 60 recommended). Spamming requests
 *   to external services or the same host with very short intervals may violate Terms of Service
 *   or cause rate-limiting / blocking.
 * - This file sends HTTP(S) GET requests (uses global fetch available in Node 18+). It does NOT
 *   send ICMP pings.
 *
 * Environment variables (all optional, except TARGET_URLS recommended):
 * - TARGET_URLS      : comma-separated list of URLs to ping (e.g. "https://your-app.onrender.com/,https://example.com/ping")
 *                      If not set, defaults to "http://localhost:3000/".
 * - INTERVAL_SECONDS : seconds between pings (default: 300 = 5 minutes). Recommended >= 60.
 * - TIMEOUT_MS       : request timeout in milliseconds (default: 5000).
 * - JITTER_SECONDS   : add random jitter up to this many seconds to each interval (default: 15).
 * - CONCURRENCY      : how many URLs to ping in parallel at each interval (default: 3).
 * - METHOD           : HTTP method to use (default: GET)
 * - HEADERS_JSON     : optional JSON string of headers to send, e.g. '{"User-Agent":"keepalive/1"}'
 *
 * Run:
 * - Dev (no compile): npx ts-node --transpile-only keepalive.ts
 * - Build+Run:
 *     tsc keepalive.ts --lib es2021,dom --target es2021 --module commonjs --outDir posted assets
 *     node posted assets/keepalive.js
 *
 * Or add a package.json script:
 *   "keepalive": "tsc keepalive.ts --outDir posted assets && node posted assets/keepalive.js"
 *
 * Exit: Ctrl+C or process signals (SIGINT/SIGTERM) perform graceful shutdown.
 */

import { setTimeout as wait } from "timers/promises";

// Ensure we are running on a Node version with global fetch (Node 18+). If not, instruct the user.
if (typeof (globalThis as any).fetch !== "function") {
  console.error(
    "Error: global fetch is not available. Use Node 18+ or run with a fetch polyfill (or use ts-node with experimental fetch)."
  );
  process.exitCode = 1;
}

// Load .env if present (lightweight)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
} catch {
  // dotenv not installed — it's fine, env vars may be set by host
}

type HeadersObj = Record<string, string>;

const DEFAULT_TARGET = "http://localhost:3000/";

const rawTargets = process.env.TARGET_URLS || DEFAULT_TARGET;
const TARGET_URLS = rawTargets
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const INTERVAL_SECONDS = Math.max(1, Number(process.env.INTERVAL_SECONDS ?? 300)); // at least 1s
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS ?? 5000);
const JITTER_SECONDS = Math.max(0, Number(process.env.JITTER_SECONDS ?? 15));
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY ?? 3));
const METHOD = (process.env.METHOD || "GET").toUpperCase();
let HEADERS: HeadersObj = {};
if (process.env.HEADERS_JSON) {
  try {
    HEADERS = JSON.parse(process.env.HEADERS_JSON);
  } catch (err) {
    console.warn("Invalid HEADERS_JSON; ignoring. Error:", (err as Error).message);
    HEADERS = {};
  }
}

if (TARGET_URLS.length === 0) {
  console.error("No target URLs configured. Set TARGET_URLS env (comma-separated). Exiting.");
  process.exit(1);
}

console.log("Keepalive pinger starting with configuration:");
console.log({
  targets: TARGET_URLS,
  interval_seconds: INTERVAL_SECONDS,
  jitter_seconds: JITTER_SECONDS,
  timeout_ms: TIMEOUT_MS,
  concurrency: CONCURRENCY,
  method: METHOD,
  headers: HEADERS,
});

// Helper: fetch with timeout using AbortController
async function fetchWithTimeout(url: string, timeoutMs: number, options: RequestInit = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Ping a single URL and return status information
async function pingOnce(url: string): Promise<{ url: string; ok: boolean; status?: number; durationMs?: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(url, TIMEOUT_MS, {
      method: METHOD,
      headers: HEADERS,
    });
    const durationMs = Date.now() - start;
    // option: don't read the body to keep it lightweight
    return { url, ok: res.ok, status: res.status, durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    return { url, ok: false, durationMs, error: (err as Error).message || String(err) };
  }
}

// Run pings for all targets with concurrency
async function runPingCycle(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Running ping cycle for ${TARGET_URLS.length} target(s).`);

  // Simple concurrency queue
  const results: Array<Promise<{ url: string; ok: boolean; status?: number; durationMs?: number; error?: string }>> = [];

  const urls = [...TARGET_URLS];
  while (urls.length > 0) {
    while (results.length < CONCURRENCY && urls.length > 0) {
      const u = urls.shift()!;
      results.push(pingOnce(u));
    }
    // wait for first to finish
    const r = await Promise.race(results.map((p, idx) => p.then((val) => ({ idx, val }))));
    // log the finished one
    const finished = r.val;
    console.log(
      `  -> ${finished.url} status=${finished.ok ? "OK" : "ERR"}${finished.status ? ` code=${finished.status}` : ""} duration=${finished.durationMs}ms${finished.error ? ` error=${finished.error}` : ""}`
    );
    // remove that promise from results
    results.splice(r.idx, 1);
  }

  // Wait for remaining results
  if (results.length > 0) {
    const settled = await Promise.all(results);
    for (const finished of settled) {
      console.log(
        `  -> ${finished.url} status=${finished.ok ? "OK" : "ERR"}${finished.status ? ` code=${finished.status}` : ""} duration=${finished.durationMs}ms${finished.error ? ` error=${finished.error}` : ""}`
      );
    }
  }

  console.log(`[${new Date().toISOString()}] Ping cycle complete.`);
}

let shuttingDown = false;

async function loopForever(): Promise<void> {
  while (!shuttingDown) {
    // run ping cycle
    try {
      await runPingCycle();
    } catch (err) {
      console.error("Unexpected error during ping cycle:", err);
    }

    // compute next interval with jitter
    const baseMs = INTERVAL_SECONDS * 1000;
    const jitterMs = JITTER_SECONDS > 0 ? Math.floor(Math.random() * JITTER_SECONDS * 1000) : 0;
    const waitMs = baseMs + jitterMs;
    console.log(`Waiting ${Math.round(waitMs / 1000)}s until next cycle (includes jitter ${Math.round(jitterMs / 1000)}s).`);
    try {
      await wait(waitMs);
    } catch {
      // interrupted by shutdown
    }
  }
  console.log("Loop stopped.");
}

async function main(): Promise<void> {
  // Initial small delay to let platform fully start (optional)
  const startupDelayMs = Number(process.env.STARTUP_DELAY_MS ?? 1500);
  if (startupDelayMs > 0) await wait(startupDelayMs);

  // Run first cycle immediately (but asynchronously)
  void loopForever();
}

// Graceful shutdown
function shutdownHandler(sig: string) {
  console.log(`Received ${sig}, shutting down keepalive pinger...`);
  shuttingDown = true;
  // allow process to exit naturally after next loop check
  setTimeout(() => {
    console.log("Exiting.");
    process.exit(0);
  }, 2000).unref();
}

process.on("SIGINT", () => shutdownHandler("SIGINT"));
process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception in keepalive pinger:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection in keepalive pinger:", reason);
});

void main();