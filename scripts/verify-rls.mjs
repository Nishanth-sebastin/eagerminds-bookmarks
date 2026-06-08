#!/usr/bin/env node
// Proves the RLS privacy model by hitting Supabase's REST API directly as one
// user against another user's rows — not through our UI. Creates two throwaway
// users, exercises every policy, and deletes them at the end (no residue).
//
// Run after applying supabase/migrations/*_init_schema_rls.sql:
//   node scripts/verify-rls.mjs
//
// Reads keys from .env.local. Exits non-zero if any privacy check fails.

import { readFileSync } from "node:fs";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SVC) {
  console.error("Missing Supabase keys in .env.local");
  process.exit(1);
}

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

const adminHeaders = {
  apikey: SVC,
  Authorization: `Bearer ${SVC}`,
  "Content-Type": "application/json",
};

async function adminCreateUser(email, password) {
  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const body = await res.json();
  return body.id;
}

async function adminDeleteUser(id) {
  await fetch(`${URL}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
}

async function login(email, password) {
  const res = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.access_token;
}

// PostgREST helpers scoped to a given user's JWT (or anon when jwt is null).
function rest(jwt) {
  const headers = { apikey: ANON, "Content-Type": "application/json" };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  return {
    async insert(row) {
      const res = await fetch(`${URL}/rest/v1/bookmarks`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(row),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
    async selectAll() {
      const res = await fetch(
        `${URL}/rest/v1/bookmarks?select=id,user_id,title,is_public`,
        { headers },
      );
      return { status: res.status, body: await res.json().catch(() => []) };
    },
    async patch(id, patch) {
      const res = await fetch(`${URL}/rest/v1/bookmarks?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(patch),
      });
      return { status: res.status, body: await res.json().catch(() => []) };
    },
    async del(id) {
      const res = await fetch(`${URL}/rest/v1/bookmarks?id=eq.${id}`, {
        method: "DELETE",
        headers: { ...headers, Prefer: "return=representation" },
      });
      return { status: res.status, body: await res.json().catch(() => []) };
    },
    async profile(jwtless) {
      const res = await fetch(
        `${URL}/rest/v1/profiles?select=id,handle`,
        { headers: jwtless ? { apikey: ANON } : headers },
      );
      return { status: res.status, body: await res.json().catch(() => []) };
    },
  };
}

const stamp = Date.now();
const A = { email: `rlsa+${stamp}@example.com`, password: "password12345" };
const B = { email: `rlsb+${stamp}@example.com`, password: "password12345" };

let aId, bId;
try {
  aId = await adminCreateUser(A.email, A.password);
  bId = await adminCreateUser(B.email, B.password);
  check("two users created", Boolean(aId && bId));

  const aJwt = await login(A.email, A.password);
  const bJwt = await login(B.email, B.password);
  check("both users logged in", Boolean(aJwt && bJwt));

  // Trigger should have auto-created a profile with a unique handle for each.
  const profs = await rest(null).profile(true);
  const handles = (profs.body || []).map((p) => p.handle);
  check(
    "profiles auto-created with unique handles",
    handles.length >= 2 && new Set(handles).size === handles.length,
    `handles: ${handles.join(", ")}`,
  );

  // User A creates one private and one public bookmark.
  const aPrivate = await rest(aJwt).insert({
    user_id: aId,
    title: "A private",
    url: "https://a.example/private",
    is_public: false,
  });
  const aPublic = await rest(aJwt).insert({
    user_id: aId,
    title: "A public",
    url: "https://a.example/public",
    is_public: true,
  });
  check("A inserts own bookmarks", aPrivate.status === 201 && aPublic.status === 201);
  const aPrivateId = aPrivate.body?.[0]?.id;
  const aPublicId = aPublic.body?.[0]?.id;

  // RLS INSERT: A cannot create a bookmark owned by B.
  const forge = await rest(aJwt).insert({
    user_id: bId,
    title: "forged",
    url: "https://a.example/forge",
    is_public: false,
  });
  check(
    "A cannot insert a bookmark owned by B",
    forge.status === 403 || forge.status === 401,
    `status ${forge.status}`,
  );

  // RLS SELECT (other user): B sees A's public row but NOT A's private row.
  const bView = await rest(bJwt).selectAll();
  const bSeesPublic = bView.body.some((r) => r.id === aPublicId);
  const bSeesPrivate = bView.body.some((r) => r.id === aPrivateId);
  check("B sees A's public bookmark", bSeesPublic);
  check("B does NOT see A's private bookmark", !bSeesPrivate);

  // RLS SELECT (anon): only public rows, never private.
  const anonView = await rest(null).selectAll();
  check(
    "anon sees only public bookmarks",
    anonView.body.every((r) => r.is_public === true) &&
      anonView.body.some((r) => r.id === aPublicId),
    `${anonView.body.length} rows`,
  );

  // RLS UPDATE: B cannot modify A's private row (0 rows affected).
  const bPatch = await rest(bJwt).patch(aPrivateId, { title: "hacked" });
  check(
    "B cannot update A's private bookmark",
    Array.isArray(bPatch.body) && bPatch.body.length === 0,
    `affected ${bPatch.body?.length ?? "?"}`,
  );

  // RLS DELETE: B cannot delete A's private row (0 rows affected).
  const bDel = await rest(bJwt).del(aPrivateId);
  check(
    "B cannot delete A's private bookmark",
    Array.isArray(bDel.body) && bDel.body.length === 0,
    `affected ${bDel.body?.length ?? "?"}`,
  );

  // Sanity: A's private row is still intact and unchanged.
  const aView = await rest(aJwt).selectAll();
  const stillPrivate = aView.body.find((r) => r.id === aPrivateId);
  check(
    "A's private bookmark survived B's attacks, unchanged",
    stillPrivate && stillPrivate.title === "A private",
  );

  // RLS DELETE (owner): A can delete its own row.
  const aDel = await rest(aJwt).del(aPrivateId);
  check("A can delete own bookmark", aDel.body?.length === 1);
} catch (err) {
  console.error("ERROR:", err);
  failures++;
} finally {
  if (aId) await adminDeleteUser(aId);
  if (bId) await adminDeleteUser(bId);
  console.log("cleanup: test users deleted");
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
