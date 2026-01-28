import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import worker from '../services/index.js';
import { createDb } from '../db/db.js';

if (!globalThis.crypto?.subtle) {
  globalThis.crypto = crypto.webcrypto;
}
if (!globalThis.atob) {
  globalThis.atob = (input) => Buffer.from(input, 'base64').toString('binary');
}

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_ISSUER: process.env.AUTH_ISSUER,
  AUTH_AUDIENCE: process.env.AUTH_AUDIENCE,
  fetch: fetch
};

for (const key of ['DATABASE_URL', 'AUTH_SECRET', 'AUTH_ISSUER', 'AUTH_AUDIENCE']) {
  if (!env[key]) {
    throw new Error(`Missing env ${key} for smoke tests`);
  }
}

const adminUserId = `test-admin-${crypto.randomUUID()}`;
const childUserId = `test-child-${crypto.randomUUID()}`;
const householdId = `test-house-${crypto.randomUUID()}`;

function base64UrlEncode(input) {
  const buf = typeof input === 'string' ? Buffer.from(input) : Buffer.from(input);
  return buf.toString('base64url');
}

function createToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const signature = crypto.createHmac('sha256', env.AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

async function apiFetch(path, { method = 'GET', body = null, token }) {
  const headers = { authorization: `Bearer ${token}` };
  let payload = undefined;
  if (body !== null) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const request = new Request(`https://worker.test${path}`, { method, headers, body: payload });
  const res = await worker.fetch(request, env);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

const adminToken = createToken({
  sub: adminUserId,
  role: 'parent',
  householdId,
  iss: env.AUTH_ISSUER,
  aud: env.AUTH_AUDIENCE
});

const childToken = createToken({
  sub: childUserId,
  role: 'kid',
  householdId,
  iss: env.AUTH_ISSUER,
  aud: env.AUTH_AUDIENCE
});

const db = createDb(env);

async function cleanup() {
  await db.query('DELETE FROM emotion_badges WHERE user_id = $1', [childUserId]);
  await db.query('DELETE FROM emotion_checkins WHERE user_id = $1', [childUserId]);
  await db.query('DELETE FROM safety_notes WHERE user_id = $1', [childUserId]);
}

after(async () => {
  await cleanup();
});

test('emotion check-ins, status, and badges', async () => {
  await cleanup();

  const first = await apiFetch('/emotion/checkin', {
    method: 'POST',
    token: childToken,
    body: { mood: 'ok', note: 'test' }
  });
  assert.equal(first.status, 200);
  assert.equal(first.json.userId, childUserId);
  assert.equal(first.json.mood, 'ok');

  const second = await apiFetch('/emotion/checkin', {
    method: 'POST',
    token: childToken,
    body: { mood: 'ok', note: 'test 2' }
  });
  assert.equal(second.status, 200);

  const status = await apiFetch('/emotion/status', { token: childToken });
  assert.equal(status.status, 200);
  assert.equal(typeof status.json.checkedInToday, 'boolean');
  assert.equal(typeof status.json.currentStreak, 'number');
  assert.equal(typeof status.json.longestStreak, 'number');
  assert.equal(status.json.checkedInToday, true);
  assert.equal(status.json.currentStreak, 1);
  assert.equal(status.json.longestStreak, 1);

  const badges = await apiFetch('/emotion/badges', { token: childToken });
  assert.equal(badges.status, 200);
  assert.ok(Array.isArray(badges.json.badges));
  for (const badge of badges.json.badges) {
    assert.deepEqual(Object.keys(badge).sort(), ['badge_id', 'earned_at']);
  }
  const ids = badges.json.badges.map(b => b.badge_id);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size);
  assert.ok(ids.includes('first_checkin'));
});

test('admin safety notes permissions and flow', async () => {
  const denied = await apiFetch('/admin/safety-notes', {
    method: 'POST',
    token: childToken,
    body: { userId: childUserId, note: 'should fail' }
  });
  assert.equal(denied.status, 403);

  const created = await apiFetch('/admin/safety-notes', {
    method: 'POST',
    token: adminToken,
    body: { userId: childUserId, note: 'monitor progress' }
  });
  assert.equal(created.status, 200);
  assert.equal(created.json.userId, childUserId);
  assert.equal(created.json.createdBy, adminUserId);

  const listed = await apiFetch(`/admin/safety-notes?user_id=${childUserId}`, { token: adminToken });
  assert.equal(listed.status, 200);
  assert.ok(Array.isArray(listed.json.notes));
  assert.ok(listed.json.notes.some(note => note.id === created.json.id));

  const patched = await apiFetch(`/admin/safety-notes/${created.json.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { resolved: true }
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.json.resolved, true);

  const status = await apiFetch('/emotion/status', { token: childToken });
  assert.equal(status.status, 200);
  assert.deepEqual(Object.keys(status.json).sort(), ['checkedInToday', 'currentStreak', 'longestStreak']);
});
