import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse, serializeOuter } from '../../node_modules/parse5/dist/index.js';

const origin = 'https://noveporte.it';
const outputDir = new URL('../public/content/pages/', import.meta.url);
const manifestFile = new URL('../public/content/manifest.json', import.meta.url);
const ignored = [/\.(pdf|docx?|xlsx?|zip)$/i, /^\/NuovoContributo/i, /^\/Fortezza(Code|Det)?/i, /^\/(Soci|Convenzioni|AttiInterni|CategorieOggetti|PersonalArea)/i];

function attr(node, name) { return node.attrs?.find(item => item.name === name)?.value; }
function hasClass(node, className) { return (attr(node, 'class') || '').split(/\s+/).includes(className); }
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) { const result = find(child, predicate); if (result) return result; }
}
function text(node) { return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join(''); }
function collectLinks(node, baseUrl, links = []) {
  if (node.tagName === 'a') {
    const href = attr(node, 'href');
    if (href && !/^(#|javascript:|mailto:|tel:)/i.test(href)) {
      try {
        const url = new URL(href, baseUrl);
        const path = normalize(url.href);
        if (url.origin === origin && !/^\/(Images|Fonts|Css|Scripts|Lightbox|WebResource|ScriptResource)\b/i.test(url.pathname) && !/\.(jpg|jpeg|png|gif|webp|svg|css|js|ico|xml)$/i.test(url.pathname)) links.push(path);
      } catch { /* ignore malformed legacy URLs */ }
    }
  }
  for (const child of node.childNodes || []) collectLinks(child, baseUrl, links);
  return links;
}
function clean(node, baseUrl) {
  if (!node.childNodes) return;
  node.childNodes = node.childNodes.filter(child => !['script', 'noscript', 'iframe'].includes(child.tagName));
  for (const child of node.childNodes) {
    if (child.attrs) {
      child.attrs = child.attrs.filter(item => !item.name.startsWith('on') && item.name !== 'srcdoc');
      for (const item of child.attrs) {
        if (item.name === 'style' && /(expression\s*\(|javascript:|behavior\s*:|-moz-binding)/i.test(item.value)) item.value = '';
        if (item.name === 'src' || item.name === 'poster') {
          try { item.value = new URL(item.value, origin).href; } catch { /* ignore malformed legacy URLs */ }
        }
        if (item.name === 'href') {
          if (/^javascript:/i.test(item.value)) item.value = '#';
          else {
            try { const url = new URL(item.value, baseUrl); item.value = url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : url.href; } catch { /* ignore */ }
          }
        }
      }
    }
    clean(child, baseUrl);
  }
}
function keyFor(path) { return createHash('sha1').update(path.toLowerCase()).digest('hex').slice(0, 16); }
function normalize(rawUrl) {
  const url = new URL(rawUrl.replace(/^http:/, 'https:'));
  return `${url.pathname === '/Default' ? '/' : url.pathname}${url.search}`;
}
async function fetchText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'NovePorteMigration/1.0' }, redirect: 'follow' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}
async function importPage(path) {
  const html = await fetchText(`${origin}${path}`);
  const document = parse(html);
  const form = find(document, node => attr(node, 'id') === 'aspnetForm');
  const content = find(document, node => ['content-page-std', 'content-page-std2'].some(name => hasClass(node, name)))
    || form?.childNodes?.find(node => node.tagName === 'div' && ['container', 'anteprima-castello', 'contain-porta'].some(name => hasClass(node, name)));
  if (!content) throw new Error('Contenuto principale non riconosciuto');
  const links = collectLinks(content, `${origin}${path}`);
  clean(content, `${origin}${path}`);
  const heading = find(content, node => node.tagName === 'h1');
  const titleNode = find(document, node => node.tagName === 'title');
  const title = (heading ? text(heading) : titleNode ? text(titleNode) : path.split('/').pop() || 'Nove Porte').replace(/\s+/g, ' ').trim();
  const key = keyFor(path);
  await writeFile(new URL(`${key}.json`, outputDir), JSON.stringify({ path, title, html: serializeOuter(content) }), 'utf8');
  return { page: { path, title, file: `${key}.json` }, links };
}

await mkdir(outputDir, { recursive: true });
const requestedPaths = process.argv.slice(2).map(path => normalize(new URL(path, origin).href));
const sitemap = requestedPaths.length ? '' : await fetchText(`${origin}/sitemap.xml`);
const paths = requestedPaths.length
  ? requestedPaths
  : [...sitemap.matchAll(/<loc>(.*?)<\/loc>/gi)].map(match => normalize(match[1])).filter((path, index, all) => all.indexOf(path) === index && !ignored.some(rule => rule.test(path)));
const seen = new Set(paths.map(path => path.toLowerCase()));
const existing = requestedPaths.length ? JSON.parse(await readFile(manifestFile, 'utf8')) : { pages: {}, failures: [] };
const manifest = existing.pages;
const failures = requestedPaths.length
  ? existing.failures.filter(item => !seen.has(item.path.toLowerCase()))
  : [];
let cursor = 0;
async function worker() {
  while (cursor < paths.length) {
    const path = paths[cursor++];
    try {
      const result = await importPage(path);
      manifest[path.toLowerCase()] = result.page;
      for (const discovered of requestedPaths.length ? [] : result.links) {
        const normalized = discovered.toLowerCase();
        if (paths.length < 1000 && !seen.has(normalized) && !ignored.some(rule => rule.test(discovered))) { seen.add(normalized); paths.push(discovered); }
      }
      console.log(`✓ ${path}`);
    }
    catch (error) { failures.push({ path, error: error.message }); console.warn(`× ${path}: ${error.message}`); }
  }
}
await Promise.all(Array.from({ length: 4 }, () => worker()));
await writeFile(manifestFile, JSON.stringify({ generatedAt: new Date().toISOString(), origin, count: Object.keys(manifest).length, pages: manifest, failures }, null, 2), 'utf8');
console.log(`Importate ${Object.keys(manifest).length}/${paths.length} pagine; errori: ${failures.length}.`);
