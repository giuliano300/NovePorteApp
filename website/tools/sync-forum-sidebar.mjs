import { readFile, writeFile } from 'node:fs/promises';
import { parse, parseFragment, serialize, serializeOuter } from '../../node_modules/parse5/dist/index.js';

const origin = 'https://noveporte.it';
const sourcePath = '/Forum/Dettaglio-Forum/La-nona-porta-9';
const manifestFile = new URL('../public/content/manifest.json', import.meta.url);
const pagesDir = new URL('../public/content/pages/', import.meta.url);

function attr(node, name) { return node.attrs?.find(item => item.name === name)?.value; }
function hasClass(node, name) { return (attr(node, 'class') || '').split(/\s+/).includes(name); }
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) { const result = find(child, predicate); if (result) return result; }
}
function findWithParent(node, predicate, parent = null) {
  if (predicate(node)) return { node, parent };
  for (const child of node.childNodes || []) {
    const result = findWithParent(child, predicate, node);
    if (result) return result;
  }
}
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

const response = await fetch(`${origin}${sourcePath}`, { headers: { 'User-Agent': 'NovePorteMigration/1.0' } });
if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
const source = parse(await response.text());
const sidebar = find(source, node => hasClass(node, 'column-right'));
if (!sidebar) throw new Error('Menu destro non trovato nella pagina sorgente');
clean(sidebar, `${origin}${sourcePath}`);
const canonicalHtml = serializeOuter(sidebar);

const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
const files = new Set(Object.values(manifest.pages)
  .filter(entry => /^\/Forum\//i.test(entry.path))
  .map(entry => entry.file));
let updated = 0;
let withoutSidebar = 0;

for (const file of files) {
  const url = new URL(file, pagesDir);
  const page = JSON.parse(await readFile(url, 'utf8'));
  const fragment = parseFragment(page.html);
  const current = findWithParent(fragment, node => hasClass(node, 'column-right'));
  if (!current?.parent) { withoutSidebar++; continue; }
  const replacement = parseFragment(canonicalHtml).childNodes[0];
  const index = current.parent.childNodes.indexOf(current.node);
  current.parent.childNodes.splice(index, 1, replacement);
  page.html = serialize(fragment);
  await writeFile(url, JSON.stringify(page), 'utf8');
  updated++;
}

console.log(`Menu destro e calendario aggiornati in ${updated} pagine forum; senza menu: ${withoutSidebar}.`);
