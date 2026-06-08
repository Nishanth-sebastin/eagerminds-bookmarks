#!/usr/bin/env node
// Throwaway: applies a SQL migration file to the Supabase Postgres DB.
// Reads credentials from .env.local and assembles the connection string in
// memory (never printed). Usage: node scripts/apply-migration.mjs <file.sql>

import { readFileSync } from "node:fs";
import pg from "pg";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <file.sql>");
  process.exit(1);
}

const ref = (env.NEXT_PUBLIC_SUPABASE_URL || "").match(
  /https?:\/\/([^.]+)\.supabase\.co/,
)?.[1];
const password = env.SUPABASE_DB_PASSWORD;
if (!ref || !password) {
  console.error("Missing project ref or SUPABASE_DB_PASSWORD in .env.local");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");

// Connection options, in order of preference:
//   1. SUPABASE_DB_URL — a full URI you paste in.
//   2. SUPABASE_DB_REGION — build the IPv4 Session Pooler URL (recommended;
//      the direct db.<ref>.supabase.co host is IPv6-only).
//   3. Fallback: direct connection (works only on IPv6-capable networks).
const enc = encodeURIComponent(password);
const connectionString = env.SUPABASE_DB_URL
  ? env.SUPABASE_DB_URL
  : env.SUPABASE_DB_HOST
    ? `postgresql://${env.SUPABASE_DB_USER || `postgres.${ref}`}:${enc}@${env.SUPABASE_DB_HOST}:${env.SUPABASE_DB_PORT || 5432}/postgres`
    : `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`;

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("connected; applying migration…");
  await client.query(sql);
  console.log("migration applied OK");
} catch (err) {
  console.error("FAILED:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
