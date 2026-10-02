import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse, serializeOuter } from '../node_modules/parse5/dist/index.js';

const origin = 'https://noveporte.it';
const outputDir = new URL('../public/content/pages/', import.meta.url);
const manifestFile = new URL('../public/content/manifest.json', import.meta.url);
const forumPath = process.argv[2];
const lastPage = Number(process.argv[3] || 1);

if (!forumPath || lastPage < 2) throw new Error('Uso: node tools/sync-forum-pagination.mjs /Forum/... <ultima-pagina>');

function attr(node, name) { return node.attrs?.find(item => item.name === name)?.value; }
function hasClass(node, name) { return (attr(node, 'class') || '').split(/\s+/).includes(name); }
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) { const result = find(child, predicate); if (result) return result; }
}
function visit(node, callback) {
  callback(node);
  for (const child of node.childNodes || []) visit(child, callback);
}
function text(node) { return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join(''); }
function keyFor(path) { return createHash('sha1').update(path.toLowerCase()).digest('hex').slice(0, 16); }

function clean(node, baseUrl) {
  if (!node.childNodes) return;
  node.childNodes = node.childNodes.filter(child => !['script', 'noscript', 'iframe'].includes(child.tagName));
  for (const child of node.childNodes) {
    if (child.attrs) {
      child.attrs = child.attrs.filter(item => !item.name.startsWith('on') && item.name !== 'srcdoc');
      for (const item of child.attrs) {
        if (item.name === 'src' || item.name === 'poster') {
          try { item.value = new URL(item.value, origin).href; } catch { /* malformed legacy URL */ }
        }
        if (item.name === 'href') {
          if (/^javascript:/i.test(item.value)) item.value = '#';
          else {
            try {
              const url = new URL(item.value, baseUrl);
              item.value = url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : url.href;
            } catch { /* malformed legacy URL */ }
          }
        }
      }
    }
    clean(child, baseUrl);
  }
}

function extractPage(html, path) {
  const document = parse(html);
  const content = find(document, node => ['content-page-std', 'content-page-std2'].some(name => hasClass(node, name)));
  if (!content) throw new Error(`Contenuto principale non riconosciuto per ${path}`);
  const detailLinks = [];
  visit(content, node => {
    if (node.tagName !== 'a' || !/HrefArticolo$/i.test(attr(node, 'id') || '')) return;
    const href = attr(node, 'href');
    if (!href) return;
    const url = new URL(href, `${origin}${forumPath}`);
    detailLinks.push(`${url.pathname}${url.search}`);
  });
  clean(content, `${origin}${forumPath}`);
  const heading = find(content, node => node.tagName === 'h1');
  return {
    title: (heading ? text(heading) : 'Forum').replace(/\s+/g, ' ').trim(),
    html: serializeOuter(content),
    detailLinks,
  };
}

async function savePage(manifest, path, page) {
  const file = `${keyFor(path)}.json`;
  await writeFile(new URL(file, outputDir), JSON.stringify({ path, title: page.title, html: page.html }), 'utf8');
  manifest[path.toLowerCase()] = { path, title: page.title, file };
}

async function importDetail(manifest, path) {
  if (manifest[path.toLowerCase()]) return false;
  const response = await fetch(`${origin}${path}`, { headers: { 'User-Agent': 'NovePorteMigration/1.0' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${path}`);
  const page = extractPage(await response.text(), path);
  await savePage(manifest, path, page);
  console.log(`✓ ${path}`);
  return true;
}

await mkdir(outputDir, { recursive: true });
const saved = JSON.parse(await readFile(manifestFile, 'utf8'));
const manifest = saved.pages;
const initialResponse = await fetch(`${origin}${forumPath}`, { headers: { 'User-Agent': 'NovePorteMigration/1.0' } });
if (!initialResponse.ok) throw new Error(`${initialResponse.status} ${initialResponse.statusText}`);
const cookie = initialResponse.headers.get('set-cookie')?.split(';')[0] || '';
const initialHtml = await initialResponse.text();
const initialDocument = parse(initialHtml);
const hidden = {};
visit(initialDocument, node => {
  if (node.tagName === 'input' && (attr(node, 'type') || '').toLowerCase() === 'hidden' && attr(node, 'name')) {
    hidden[attr(node, 'name')] = attr(node, 'value') || '';
  }
});

const detailLinks = new Set();
for (let pageNumber = 2; pageNumber <= lastPage; pageNumber++) {
  const body = new URLSearchParams(hidden);
  body.set('__EVENTTARGET', `ctl00$ContentPlaceHolder1$DataPagerProducts$ctl00$ctl${String(pageNumber - 1).padStart(2, '0')}`);
  body.set('__EVENTARGUMENT', '');
  const response = await fetch(`${origin}${forumPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'NovePorteMigration/1.0',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body,
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: pagina ${pageNumber}`);
  const path = `${forumPath}?pagina=${pageNumber}`;
  const page = extractPage(await response.text(), path);
  await savePage(manifest, path, page);
  page.detailLinks.forEach(link => detailLinks.add(link));
  console.log(`✓ ${path} (${page.detailLinks.length} articoli)`);
}

for (const detailPath of detailLinks) await importDetail(manifest, detailPath);
saved.generatedAt = new Date().toISOString();
saved.count = Object.keys(manifest).length;
await writeFile(manifestFile, JSON.stringify(saved, null, 2), 'utf8');
console.log(`Paginazione importata; ${detailLinks.size} articoli verificati.`);
