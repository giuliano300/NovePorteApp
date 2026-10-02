import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteConfig, validateSiteConfig } from './config.mjs';

validateSiteConfig();
const { host, port, fortezzaPassword, websiteApiToken, appApiOrigin, appAssetOrigin } = siteConfig;
const passwordHash = digest(fortezzaPassword);
const sessions = new Map();
const attempts = new Map();
const sessionTtl = 60 * 60 * 1000;
const privateManifestPath = fileURLToPath(new URL('./private/content/manifest.json', import.meta.url));
const privatePagesRoot = fileURLToPath(new URL('./private/content/pages/', import.meta.url));
const privateAssetsRoot = fileURLToPath(new URL('./private/assets/', import.meta.url));
const productImagesPath = fileURLToPath(new URL('./private/content/product-images.json', import.meta.url));
const resolvedPrivateAssetsRoot = resolve(privateAssetsRoot);

function digest(value) { return createHash('sha256').update(value, 'utf8').digest(); }
function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(pair => pair.length === 2));
}
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}
function contentType(path) {
  return ({ '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.gif':'image/gif', '.webp':'image/webp', '.bmp':'image/bmp', '.svg':'image/svg+xml', '.pdf':'application/pdf', '.doc':'application/msword', '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.vcf':'text/vcard; charset=utf-8' })[extname(path).toLowerCase()] || 'application/octet-stream';
}
function privateProductAsset(fileName) {
  return `/api/private-asset?path=${encodeURIComponent(`/Public/FotoProdotti/${fileName}`)}`;
}
async function completeProductImages(page, path) {
  const match = path.match(/^\/Oggetto\?Id=(\d+)$/i);
  if (!match) return page;
  const imageMap = JSON.parse(await readFile(productImagesPath, 'utf8'));
  const product = imageMap[match[1]] || { categoryId: 0, images: [] };
  const images = product.images || [];
  const ids = ['ImgProdotto', 'ImgFoto2', 'ImgFoto3', 'ImgFoto4'];
  let html = page.html;
  ids.forEach((id, index) => {
    if (images[index]) {
      const source = privateProductAsset(images[index]);
      html = html.replace(
        new RegExp(`(<img[^>]+id="ctl00_ContentPlaceHolder1_${id}"[^>]+src=")[^"]*(")`, 'i'),
        `$1${source}$2`
      );
      return;
    }
    if (index > 0) {
      html = html.replace(
        new RegExp(`<p>\\s*<a[^>]+id="ctl00_ContentPlaceHolder1_HrefImg${index + 1}"[^>]*>\\s*<img[^>]+id="ctl00_ContentPlaceHolder1_${id}"[^>]*>\\s*</a>\\s*</p>`, 'i'),
        ''
      );
    }
  });
  if (product.categoryId > 0) {
    html = html.replace(
      /(<div[^>]+class="[^"]*btn-back[^"]*"[^>]*>\s*<a\s+href=")[^"]*(")/i,
      `$1/Oggetti?IdCategoria=${product.categoryId}$2`
    );
  }
  return { ...page, html };
}
async function sendPrivatePage(req, res, url) {
  if (!isAuthenticated(req)) return send(res, 401, { message: 'Sessione Fortezza richiesta.' });
  try {
    const path = url.searchParams.get('path') || '';
    const manifest = JSON.parse(await readFile(privateManifestPath, 'utf8'));
    const entry = manifest.pages[path.toLowerCase()];
    if (!entry) return send(res, 404, { message: 'Pagina non trovata.' });
    const page = JSON.parse(await readFile(resolve(privatePagesRoot, entry.file), 'utf8'));
    return send(res, 200, await completeProductImages(page, path));
  } catch { return send(res, 500, { message: 'Contenuto privato non disponibile.' }); }
}
async function sendPrivateAsset(req, res, url) {
  if (!isAuthenticated(req)) return send(res, 401, { message: 'Sessione Fortezza richiesta.' });
  try {
    const requested = (url.searchParams.get('path') || '').replaceAll('\\', '/');
    const target = resolve(resolvedPrivateAssetsRoot, requested.replace(/^\/+/, ''));
    if (target !== resolvedPrivateAssetsRoot && !target.startsWith(`${resolvedPrivateAssetsRoot}${sep}`)) return send(res, 400, { message: 'Percorso non valido.' });
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

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    let rejected = false;
    req.on('data', chunk => {
      length += chunk.length;
      if (length > maxBytes) {
        if (!rejected) reject(new Error('Payload troppo grande'));
        rejected = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!rejected) resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}

async function proxyMembers(req, res, url) {
  if (!isAuthenticated(req)) return send(res, 401, { message: 'Sessione Fortezza richiesta.' });
  if (!websiteApiToken) return send(res, 503, { message: 'Token API del sito non configurato.' });

  const suffix = url.pathname.slice('/api/site/members'.length);
  if (suffix && !/^(?:\/[a-z0-9-]+|\/member\/\d+)$/i.test(suffix)) return send(res, 400, { message: 'Percorso non valido.' });

  const upstreamUrl = new URL(`/api/app/members${suffix}`, appApiOrigin);
  const search = url.searchParams.get('search');
  if (search) upstreamUrl.searchParams.set('search', search.slice(0, 100));

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: { 'X-NovePorte-Website-Token': websiteApiToken, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.end(body);
  } catch {
    return send(res, 502, { message: 'Servizio Libro Soci temporaneamente non disponibile.' });
  }
}

async function proxyProducts(req, res, url) {
  if (!isAuthenticated(req)) return send(res, 401, { message: 'Sessione Fortezza richiesta.' });
  if (!websiteApiToken) return send(res, 503, { message: 'Token API del sito non configurato.' });

  const suffix = url.pathname.slice('/api/site/products'.length);
  const isList = req.method === 'GET' && suffix === '';
  const isDetail = req.method === 'GET' && /^\/\d+$/.test(suffix);
  const isOrder = req.method === 'POST' && suffix === '/orders';
  if (!isList && !isDetail && !isOrder)
    return send(res, 400, { message: 'Percorso e-commerce non valido.' });

  try {
    const headers = {
      'X-NovePorte-Website-Token': websiteApiToken,
      Accept: 'application/json'
    };
    let body;
    if (isOrder) {
      const contentType = req.headers['content-type'];
      if (!contentType?.startsWith('multipart/form-data;'))
        return send(res, 415, { message: 'Formato della richiesta non valido.' });
      headers['Content-Type'] = contentType;
      body = await readBody(req, 11_000_000);
    }
    const upstream = await fetch(new URL(`/api/app/products${suffix}`, appApiOrigin), {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.timeout(isOrder ? 30000 : 15000)
    });
    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.end(responseBody);
  } catch (error) {
    return send(res, error?.message === 'Payload troppo grande' ? 413 : 502, {
      message: error?.message === 'Payload troppo grande'
        ? 'Il documento supera la dimensione massima consentita.'
        : 'Servizio e-commerce temporaneamente non disponibile.'
    });
  }
}

async function proxyAppAsset(req, res, url) {
  if (!isAuthenticated(req)) return send(res, 401, { message: 'Sessione Fortezza richiesta.' });
  const requested = url.searchParams.get('path') || '';
  if (!/^\/uploads\/(?:soci|prefectures\/(?:members|crests))\/[a-z0-9._%()-]+$/i.test(requested))
    return send(res, 400, { message: 'Percorso non valido.' });
  try {
    const upstream = await fetch(new URL(requested, appAssetOrigin), { signal: AbortSignal.timeout(15000) });
    if (!upstream.ok) return send(res, upstream.status, { message: 'Immagine non disponibile.' });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(200, {
      'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.end(body);
  } catch { return send(res, 502, { message: 'Immagine temporaneamente non disponibile.' }); }
}

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || host}`);
  if (req.method === 'GET' && /^\/api\/site\/members(?:\/[a-z0-9-]+|\/member\/\d+)?$/i.test(url.pathname)) return proxyMembers(req, res, url);
  if ((req.method === 'GET' || req.method === 'POST') && /^\/api\/site\/products(?:\/\d+|\/orders)?$/i.test(url.pathname)) return proxyProducts(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/site/app-asset') return proxyAppAsset(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/private-content') return sendPrivatePage(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/private-asset') return sendPrivateAsset(req, res, url);
  if (req.method === 'GET' && url.pathname === '/api/auth/session') return send(res, 200, { authenticated: isAuthenticated(req) });
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
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
