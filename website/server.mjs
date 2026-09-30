import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = Number(process.env['NOVEPORTE_API_PORT'] || 4300);
const configuredPassword = process.env['NOVEPORTE_FORTEZZA_PASSWORD'];
const passwordHash = configuredPassword ? digest(configuredPassword) : null;
const sessions = new Map();
const attempts = new Map();
const sessionTtl = 60 * 60 * 1000;
const privateManifestPath = fileURLToPath(new URL('./private/content/manifest.json', import.meta.url));
const privatePagesRoot = fileURLToPath(new URL('./private/content/pages/', import.meta.url));
const privateAssetsRoot = fileURLToPath(new URL('./private/assets/', import.meta.url));

function digest(value) { return createHash('sha256').update(value, 'utf8').digest(); }
function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(pair => pair.length === 2));
}
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}
function contentType(path) {
  return ({ '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.gif':'image/gif', '.webp':'image/webp', '.svg':'image/svg+xml', '.pdf':'application/pdf', '.doc':'application/msword', '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.vcf':'text/vcard; charset=utf-8' })[extname(path).toLowerCase()] || 'application/octet-stream';
}
async function sendPrivatePage(req, res, url) {
  if (!isAuthenticated(req)) return send(res, 401, { message: 'Sessione Fortezza richiesta.' });
  try {
    const path = url.searchParams.get('path') || '';
    const manifest = JSON.parse(await readFile(privateManifestPath, 'utf8'));
    const entry = manifest.pages[path.toLowerCase()];
    if (!entry) return send(res, 404, { message: 'Pagina non trovata.' });
    const page = JSON.parse(await readFile(resolve(privatePagesRoot, entry.file), 'utf8'));
    return send(res, 200, page);
  } catch { return send(res, 500, { message: 'Contenuto privato non disponibile.' }); }
}
async function sendPrivateAsset(req, res, url) {
  if (!isAuthenticated(req)) return send(res, 401, { message: 'Sessione Fortezza richiesta.' });
  try {
    const requested = (url.searchParams.get('path') || '').replaceAll('\\', '/');
    const target = resolve(privateAssetsRoot, `.${requested.startsWith('/') ? requested : `/${requested}`}`);
    if (target !== privateAssetsRoot && !target.startsWith(`${privateAssetsRoot}${sep}`)) return send(res, 400, { message: 'Percorso non valido.' });
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': contentType(target), 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
    return res.end(data);
  } catch { return send(res, 404, { message: 'Allegato non trovato.' }); }
}
function isAuthenticated(req) {
  const token = parseCookies(req.headers.cookie).np_fortezza;
  const expires = token && sessions.get(token);
  if (!expires || expires < Date.now()) { if (token) sessions.delete(token); return false; }
  return true;
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 2048) reject(new Error('Payload troppo grande')); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('JSON non valido')); } });
    req.on('error', reject);
  });
}

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || host}`);
  if (req.method === 'GET' && url.pathname === '/api/private-content') return sendPrivatePage(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/private-asset') return sendPrivateAsset(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/auth/session') return send(res, 200, { authenticated: isAuthenticated(req) });
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    if (!passwordHash) return send(res, 503, { message: 'Password Fortezza non configurata sul server.' });
    const ip = req.socket.remoteAddress || 'unknown';
    const record = attempts.get(ip) || { count: 0, blockedUntil: 0 };
    if (record.blockedUntil > Date.now()) return send(res, 429, { message: 'Troppi tentativi. Riprova tra qualche minuto.' });
    try {
      const { password = '' } = await readJson(req);
      const candidate = digest(String(password));
      if (!timingSafeEqual(passwordHash, candidate)) {
        record.count += 1;
        if (record.count >= 5) { record.blockedUntil = Date.now() + 5 * 60 * 1000; record.count = 0; }
        attempts.set(ip, record);
        return send(res, 401, { message: 'Codice errato.' });
      }
      attempts.delete(ip);
      const token = randomBytes(32).toString('base64url');
      sessions.set(token, Date.now() + sessionTtl);
      return send(res, 200, { authenticated: true }, { 'Set-Cookie': `np_fortezza=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionTtl / 1000}` });
    } catch { return send(res, 400, { message: 'Richiesta non valida.' }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = parseCookies(req.headers.cookie).np_fortezza;
    if (token) sessions.delete(token);
    return send(res, 200, { authenticated: false }, { 'Set-Cookie': 'np_fortezza=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
  }
  send(res, 404, { message: 'Risorsa non trovata.' });
}).listen(port, host, () => console.log(`Nove Porte API attiva su http://${host}:${port}`));
