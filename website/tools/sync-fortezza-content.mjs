import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse, serializeOuter } from '../../node_modules/parse5/dist/index.js';

const origin = 'https://noveporte.it';
const outputDir = new URL('../private/content/pages/', import.meta.url);
const manifestFile = new URL('../private/content/manifest.json', import.meta.url);
const privateAssets = new URL('../private/assets/', import.meta.url);
const legacyRoot = new URL('../../../Sito-vecchio/', import.meta.url);
const submitCode = process.env['NOVEPORTE_SOURCE_SUBMIT_CODE'];
if (!submitCode) throw new Error('Imposta NOVEPORTE_SOURCE_SUBMIT_CODE per sincronizzare la Fortezza.');

const cookies = new Map();
function updateCookies(headers) {
  const values = headers.getSetCookie?.() || (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);
  for (const value of values) {
    const pair = value.split(';', 1)[0];
    const separator = pair.indexOf('=');
    if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}
function cookieHeader() { return [...cookies].map(([key, value]) => `${key}=${value}`).join('; '); }
async function request(path, options = {}) {
  const response = await fetch(new URL(path, origin), {
    ...options,
    redirect: options.redirect || 'follow',
    headers: { 'User-Agent': 'NovePorteMigration/1.0', Cookie: cookieHeader(), ...(options.headers || {}) },
  });
  updateCookies(response.headers);
  return response;
}
function attr(node, name) { return node.attrs?.find((item) => item.name === name)?.value; }
function setAttr(node, name, value) {
  const current = node.attrs?.find((item) => item.name === name);
  if (current) current.value = value;
  else (node.attrs ||= []).push({ name, value });
}
function hasClass(node, className) { return (attr(node, 'class') || '').split(/\s+/).includes(className); }
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) { const result = find(child, predicate); if (result) return result; }
}
function walk(node, callback) {
  callback(node);
  for (const child of node.childNodes || []) walk(child, callback);
}
function text(node) { return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join(''); }
function normalize(raw, base = origin) {
  const url = new URL(raw.replace(/^http:/, 'https:'), base);
  return `${url.pathname}${url.search}`;
}
function allowed(path) {
  return /^\/(Soci|Socio(?:\?|$)|Convenzioni|RegistroConvenzioni|AttiInterni|CategorieOggetti|Oggetti(?:\?|$)|Oggetto(?:\?|$)|PersonalArea|RichiestaModificaDati(?:\.aspx)?|RicercaSocio|TipoSociPage|Scudieri-\d+|Cavalieri-\d+|Guardiani-\d+|Fondatori-\d+|Mecenati-\d+|Prefettura(?:\?|$)|CalendarioEventi)/i.test(path);
}
function isPrivateAsset(pathname) {
  return /^\/(Allegati|Public\/(FotoSoci|StemmiPrefetture|FotoCategorie|FotoProdotti|Convenzioni|Atti|VcfPrefetture|UtentiPrefetture))\//i.test(pathname);
}
function collectLinks(document, baseUrl) {
  const links = [];
  walk(document, (node) => {
    if (node.tagName !== 'a') return;
    const href = attr(node, 'href');
    if (!href || /^(#|javascript:|mailto:|tel:)/i.test(href)) return;
    try {
      const url = new URL(href, baseUrl);
      const path = normalize(url.href);
      if (url.origin === origin && allowed(path)) links.push(path);
    } catch { /* malformed legacy link */ }
  });
  return links;
}
function clean(node, baseUrl) {
  if (!node.childNodes) return;
  node.childNodes = node.childNodes.filter((child) => !['script', 'noscript', 'iframe'].includes(child.tagName));
  for (const child of node.childNodes) {
    if (child.attrs) {
      child.attrs = child.attrs.filter((item) => !item.name.startsWith('on') && item.name !== 'srcdoc');
      for (const item of child.attrs) {
        if (item.name === 'style' && /(expression\s*\(|javascript:|behavior\s*:|-moz-binding)/i.test(item.value)) item.value = '';
        if (item.name === 'src' || item.name === 'poster') {
          try {
            const url = new URL(item.value, origin);
            item.value = url.origin === origin && isPrivateAsset(url.pathname)
              ? `/api/private-asset?path=${encodeURIComponent(url.pathname)}`
              : url.href;
          } catch { /* malformed URL */ }
        }
        if (item.name === 'href') {
          if (/^javascript:/i.test(item.value)) item.value = '#';
          else {
            try {
              const url = new URL(item.value, baseUrl);
              if (url.origin === origin && isPrivateAsset(url.pathname)) item.value = `/api/private-asset?path=${encodeURIComponent(url.pathname)}`;
              else if (url.origin !== origin || /\.(pdf|docx?|xlsx?|zip)$/i.test(url.pathname)) item.value = url.href;
              else item.value = `${url.pathname}${url.search}${url.hash}`;
            } catch { /* malformed URL */ }
          }
        }
      }
    }
    clean(child, baseUrl);
  }
}
function hiddenFields(html) {
  const document = parse(html);
  const fields = {};
  walk(document, (node) => {
    if (node.tagName === 'input' && attr(node, 'name') && (attr(node, 'type') || '').toLowerCase() === 'hidden') {
      fields[attr(node, 'name')] = attr(node, 'value') || '';
    }
  });
  return fields;
}
function keyFor(path) { return createHash('sha1').update(path.toLowerCase()).digest('hex').slice(0, 16); }

async function login() {
  const initial = await request('/FortezzaCode.aspx');
  if (!initial.ok) throw new Error(`Login iniziale: HTTP ${initial.status}`);
  const fields = hiddenFields(await initial.text());
  const body = new URLSearchParams({
    ...fields,
    __EVENTTARGET: '',
    __EVENTARGUMENT: '',
    'ctl00$ContentPlaceHolder1$TxtCode': submitCode,
    'ctl00$ContentPlaceHolder1$BtnEnter': 'ACCEDI',
  });
  const response = await request('/FortezzaCode.aspx', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const html = await response.text();
  if (!html.includes('/AttiInterni')) throw new Error('Accesso alla Fortezza non riuscito.');
  return html;
}

async function discoverCalendar(fortezzaHtml) {
  const fields = hiddenFields(fortezzaHtml);
  const body = new URLSearchParams({ ...fields, __EVENTTARGET: 'ctl00$ContentPlaceHolder1$LnkCal', __EVENTARGUMENT: '' });
  const response = await request('/FortezzaDet.aspx', {
    method: 'POST',
    body,
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const location = response.headers.get('location');
  return location ? normalize(location) : '/CalendarioEventi';
}

async function importPage(path) {
  const response = await request(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  if (html.includes('digiti il codice segreto')) throw new Error('Sessione sorgente scaduta');
  const document = parse(html);
  const content = find(document, (node) => ['content-page-std', 'content-page-std2'].some((name) => hasClass(node, name)));
  if (!content) throw new Error('Contenuto principale non riconosciuto');
  const links = collectLinks(document, `${origin}${path}`);
  clean(content, `${origin}${path}`);
  walk(content, (node) => {
    if (node.tagName === 'form') {
      setAttr(node, 'action', '#');
      setAttr(node, 'method', 'get');
    }
  });
  const heading = find(content, (node) => node.tagName === 'h1');
  const titleNode = find(document, (node) => node.tagName === 'title');
  const title = (heading ? text(heading) : titleNode ? text(titleNode) : path.split('/').pop() || 'Fortezza').replace(/\s+/g, ' ').trim();
  const file = `${keyFor(path)}.json`;
  await writeFile(new URL(file, outputDir), JSON.stringify({ path, title, html: serializeOuter(content) }), 'utf8');
  return { entry: { path, title, file }, links };
}

await mkdir(outputDir, { recursive: true });
await mkdir(privateAssets, { recursive: true });

// The legacy folder is the authoritative inventory for protected pages/assets.
const legacyFiles = await readdir(legacyRoot);
const legacyPrivatePages = legacyFiles
  .filter((name) => /^(Soci|Socio|Convenzioni|RegistroConvenzioni|AttiInterni|CategorieOggetti|Oggetti|Oggetto|PersonalArea|RichiestaModificaDati|RicercaSocio|TipoSociPage|Prefettura|CalendarioEventi)\.aspx$/i.test(name))
  .map((name) => `/${name.replace(/\.aspx$/i, '')}`);
for (const sourceName of legacyFiles.filter((name) => /\.aspx$/i.test(name))) {
  const source = await readFile(new URL(sourceName, legacyRoot), 'utf8');
  for (const match of source.matchAll(/href=["']([^"'<%]+)["']/gi)) {
    try {
      const path = normalize(match[1], origin);
      if (allowed(path) && !legacyPrivatePages.some((item) => item.toLowerCase() === path.toLowerCase())) legacyPrivatePages.push(path);
    } catch { /* malformed legacy href */ }
  }
}

for (const directory of [
  'Allegati',
  'Public/FotoSoci',
  'Public/StemmiPrefetture',
  'Public/FotoCategorie',
  'Public/FotoProdotti',
  'Public/Convenzioni',
  'Public/Atti',
  'Public/VcfPrefetture',
  'Public/UtentiPrefetture',
]) {
  const source = new URL(`${directory}/`, legacyRoot);
  const target = new URL(`${directory}/`, privateAssets);
  await cp(fileURLToPath(source), fileURLToPath(target), { recursive: true, force: true });
}

const fortezzaHtml = await login();
const calendarPath = await discoverCalendar(fortezzaHtml);
const paths = [...new Set([...legacyPrivatePages, calendarPath])];
const seen = new Set(paths.map((path) => path.toLowerCase()));
const manifest = {};
const failures = [];

for (let cursor = 0; cursor < paths.length && paths.length < 250; cursor += 1) {
  const path = paths[cursor];
  try {
    const { entry, links } = await importPage(path);
    manifest[path.toLowerCase()] = entry;
    for (const link of links) {
      if (!seen.has(link.toLowerCase())) {
        seen.add(link.toLowerCase());
        paths.push(link);
      }
    }
    console.log(`✓ ${path}`);
  } catch (error) {
    failures.push({ path, error: error.message });
    console.warn(`× ${path}: ${error.message}`);
  }
}

await writeFile(manifestFile, JSON.stringify({ generatedAt: new Date().toISOString(), origin, count: Object.keys(manifest).length, pages: manifest, failures }, null, 2), 'utf8');
console.log(`Importate ${Object.keys(manifest).length}/${paths.length} pagine protette; errori: ${failures.length}.`);
