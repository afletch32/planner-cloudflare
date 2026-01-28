import { ROLE_SET } from './roles.js';
import { PermissionError } from '../validation/errors.js';

function base64UrlDecode(input) {
  const pad = '='.repeat((4 - (input.length % 4)) % 4);
  const normalized = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(normalized);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
  return bytes;
}

async function verifyHmacJwt(token, secret, issuer, audience) {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) throw new Error('Invalid token');
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const signature = base64UrlDecode(signatureB64);
  const verified = await crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(data)
  );
  if (!verified) throw new Error('Invalid signature');
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
  if (issuer && payload.iss !== issuer) throw new Error('Invalid issuer');
  if (audience && payload.aud !== audience) throw new Error('Invalid audience');
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('Token expired');
  return payload;
}

export async function requireAuth(req, env) {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) throw new PermissionError('Unauthorized');
  const token = match[1];
  const payload = await verifyHmacJwt(
    token,
    env.AUTH_SECRET,
    env.AUTH_ISSUER,
    env.AUTH_AUDIENCE
  );
  if (!payload.sub || !payload.role || !ROLE_SET.includes(payload.role)) {
    throw new PermissionError('Invalid auth payload');
  }
  return {
    userId: payload.sub,
    householdId: payload.householdId || null,
    role: payload.role,
    email: payload.email || null
  };
}
