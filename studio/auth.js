const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_COOKIE = 'moinander_studio_session';
const SESSION_MS = 8 * 60 * 60 * 1000;
// Cloudflare Workers WebCrypto accepts at most 100,000 PBKDF2 iterations.
const ITERATIONS = 100_000;

function base64url(bytes) {
  let result = '';
  for (const byte of bytes) result += String.fromCharCode(byte);
  return btoa(result).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const decoded = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch { return null; }
}

function equal(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
  return difference === 0;
}

function randomUrlBytes(length) {
  return base64url(crypto.getRandomValues(new Uint8Array(length)));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

async function passwordHash(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromBase64url(salt), iterations, hash: 'SHA-256' }, key, 256);
  return new Uint8Array(bits);
}

export async function createPasswordRecord(email, password) {
  const normalized = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || password.length < 16) throw new Error('Gültige E-Mail und Passwort mit mindestens 16 Zeichen erforderlich.');
  const salt = randomUrlBytes(24);
  return { email: normalized, salt, hash: base64url(await passwordHash(password, salt, ITERATIONS)), iterations: ITERATIONS, version: randomUrlBytes(18) };
}

export function accounts(env) {
  if (!env.STUDIO_SESSION_SECRET || env.STUDIO_SESSION_SECRET.length < 32 || !env.STUDIO_ADMIN_ACCOUNTS || !env.LOGIN_LIMITER) return null;
  try {
    const list = JSON.parse(env.STUDIO_ADMIN_ACCOUNTS);
    if (!Array.isArray(list) || list.length < 1 || list.length > 5) return null;
    const emails = new Set();
    for (const item of list) {
      if (!item || typeof item.email !== 'string' || item.email !== item.email.toLowerCase() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email) || emails.has(item.email) ||
          !fromBase64url(item.salt) || fromBase64url(item.salt).length < 16 || !fromBase64url(item.hash) || fromBase64url(item.hash).length !== 32 ||
          !Number.isInteger(item.iterations) || item.iterations !== ITERATIONS || !/^[A-Za-z0-9_-]{20,40}$/.test(item.version)) return null;
      emails.add(item.email);
    }
    return list;
  } catch { return null; }
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

function sessionCookie(request) {
  const match = request.headers.get('cookie')?.match(/(?:^|;\s*)moinander_studio_session=([^;]+)/);
  return match?.[1] || '';
}

export async function getSession(request, env, list = accounts(env)) {
  if (!list) return null;
  const [body, signature, extra] = sessionCookie(request).split('.');
  if (!body || !signature || extra || body.length > 2048) return null;
  if (!equal(fromBase64url(signature), await hmac(env.STUDIO_SESSION_SECRET, body))) return null;
  try {
    const value = JSON.parse(decoder.decode(fromBase64url(body)));
    const account = list.find((item) => item.email === value.email);
    if (!account || value.version !== account.version || !Number.isFinite(value.exp) || value.exp <= Date.now() || value.exp > Date.now() + SESSION_MS ||
        !/^[A-Za-z0-9_-]{32}$/.test(value.csrf)) return null;
    return { email: value.email, csrf: value.csrf };
  } catch { return null; }
}

export async function verifyLogin(email, password, list) {
  const account = list.find((item) => item.email === String(email).trim().toLowerCase());
  if (!account || typeof password !== 'string' || password.length < 16 || password.length > 1024) return null;
  const candidate = await passwordHash(password, account.salt, account.iterations);
  return equal(candidate, fromBase64url(account.hash)) ? account : null;
}

export async function newSessionCookie(request, env, account) {
  const csrf = randomUrlBytes(24);
  const body = base64url(encoder.encode(JSON.stringify({ email: account.email, version: account.version, csrf, exp: Date.now() + SESSION_MS })));
  const signature = base64url(await hmac(env.STUDIO_SESSION_SECRET, body));
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return { csrf, cookie: `${SESSION_COOKIE}=${body}.${signature}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=28800` };
}

export function clearedSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=0`;
}
