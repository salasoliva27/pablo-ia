#!/usr/bin/env node
// MCP health probe. Pings the underlying services for the 4 most-critical MCPs
// and prints a one-line status report. Designed for a Claude Code statusLine
// or a manual `node scripts/mcp-health.mjs` sanity check.
//
// Output formats:
//   default: human-readable one-liner with ✓/✗ glyphs
//   --json:  machine-readable JSON (for status-line consumers)
//
// Probes:
//   memory     — Supabase REST ping (auth via SERVICE_ROLE_KEY)
//   snowflake  — DNS resolves on SNOWFLAKE_ACCOUNT (cheap; full conn = MFA push)
//   github     — REST /user (token-scoped)
//   neo4j      — bolt session RETURN 1 (also serves Aura keep-alive)
//
// Exit 0 always (so it never breaks the status line). Failures show in output.

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dns from "node:dns/promises";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const require = createRequire(path.join(repoRoot, "scripts", "neo4j", "package.json"));

const TIMEOUT_MS = 2500;
const json = process.argv.includes("--json");

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms)),
  ]);
}

async function probeMemory() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, reason: "missing env" };
  try {
    const url = `${process.env.SUPABASE_URL}/rest/v1/memories?select=id&limit=1`;
    const r = await withTimeout(fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }), TIMEOUT_MS, "supabase");
    if (!r.ok) return { ok: false, reason: `http ${r.status}` };
    return { ok: true };
  } catch (e) { return { ok: false, reason: e.message }; }
}

async function probeNeo4j() {
  if (!process.env.NEO4J_URI || !process.env.NEO4J_USER || !process.env.NEO4J_PASSWORD) return { ok: false, reason: "missing env" };
  const neo4j = require("neo4j-driver");
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
    { connectionTimeout: TIMEOUT_MS }
  );
  try {
    const session = driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
      await withTimeout(session.run("RETURN 1"), TIMEOUT_MS, "neo4j");
      return { ok: true };
    } finally { await session.close(); }
  } catch (e) {
    return { ok: false, reason: e.code || e.message };
  } finally { await driver.close(); }
}

async function probeSnowflake() {
  if (!process.env.SNOWFLAKE_ACCOUNT) return { ok: false, reason: "missing env" };
  try {
    const host = `${process.env.SNOWFLAKE_ACCOUNT}.snowflakecomputing.com`;
    await withTimeout(dns.lookup(host), TIMEOUT_MS, "snowflake-dns");
    return { ok: true };
  } catch (e) { return { ok: false, reason: e.code || e.message }; }
}

async function probeGithub() {
  if (!process.env.GITHUB_TOKEN) return { ok: false, reason: "missing env" };
  try {
    const r = await withTimeout(fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "User-Agent": "mcp-health" },
    }), TIMEOUT_MS, "github");
    if (!r.ok) return { ok: false, reason: `http ${r.status}` };
    return { ok: true };
  } catch (e) { return { ok: false, reason: e.message }; }
}

const probes = await Promise.all([
  probeMemory().then(r => ({ name: "memory", ...r })),
  probeNeo4j().then(r => ({ name: "neo4j", ...r })),
  probeSnowflake().then(r => ({ name: "snowflake", ...r })),
  probeGithub().then(r => ({ name: "github", ...r })),
]);

if (json) {
  process.stdout.write(JSON.stringify({ ts: new Date().toISOString(), probes }) + "\n");
} else {
  const parts = probes.map(p => `${p.ok ? "✓" : "✗"} ${p.name}${p.ok ? "" : `(${p.reason})`}`);
  process.stdout.write(parts.join("  ") + "\n");
}
