import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parse, serializeOuter } from '../../node_modules/parse5/dist/index.js';

const origin = 'https://noveporte.it';
const publicPages = new URL('../public/content/pages/', import.meta.url);
const publicManifestFile = new URL('../public/content/manifest.json', import.meta.url);
const privatePages = new URL('../private/content/pages/', import.meta.url);
const privateManifestFile = new URL('../private/content/manifest.json', import.meta.url);
const sourceCode = process.env.NOVEPORTE_SOURCE_SUBMIT_CODE;
const currentYear = new Date().getFullYear();
const cookies = new Map();

function attr(node, name) { return node.attrs?.find(item => item.name === name)?.value; }
function setAttr(node, name, value) {
  const item = node.attrs?.find(attribute => attribute.name === name);
  if (item) item.value = value;
  else (node.attrs ||= []).push({ name, value });
}
function hasClass(node, name) { return (attr(node, 'class') || '').split(/\s+/).includes(name); }
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) { const result = find(child, predicate); if (result) return result; }
}
function walk(node, callback) {
  callback(node);
  for (const child of node.childNodes || []) walk(child, callback);
}
function text(node) { return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join(''); }
function keyFor(path) { return createHash('sha1').update(path.toLowerCase()).digest('hex').slice(0, 16); }
function updateCookies(headers) {
  for (const value of headers.getSetCookie?.() || (headers.get('set-cookie') ? [headers.get('set-cookie')] : [])) {
    const [pair] = value.split(';');
    const separator = pair.indexOf('=');
    if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}
async function request(path, options = {}) {
  const response = await fetch(new URL(path, origin), {
    ...options,
    headers: { 'User-Agent': 'NovePorteMigration/1.0', Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; '), ...(options.headers || {}) },
  });
  updateCookies(response.headers);
  return response;
}
function hiddenFields(html) {
  const fields = {};
  walk(parse(html), node => {
    if (node.tagName === 'input' && attr(node, 'name') && (attr(node, 'type') || '').toLowerCase() === 'hidden') fields[attr(node, 'name')] = attr(node, 'value') || '';
  });
  return fields;
}
function clean(node, baseUrl) {
  if (!node.childNodes) return;
  node.childNodes = node.childNodes.filter(child => !['script', 'noscript', 'iframe'].includes(child.tagName));
  for (const child of node.childNodes) {
    if (child.attrs) {
      child.attrs = child.attrs.filter(item => !item.name.startsWith('on') && item.name !== 'srcdoc');
      for (const item of child.attrs) {
        if (['src', 'poster'].includes(item.name)) {
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
  clean(content, `${origin}${path}`);
  const heading = find(content, node => node.tagName === 'h1');
  const title = (heading ? text(heading) : 'Eventi').replace(/\s+/g, ' ').trim();
  return { path, title, html: serializeOuter(content) };
}
function replaceText(node, pattern, replacement) {
  walk(node, item => { if (item.nodeName === '#text') item.value = item.value.replace(pattern, replacement); });
}
function setLink(document, id, href) {
  const link = find(document, node => node.tagName === 'a' && attr(node, 'id') === id);
  if (link) setAttr(link, 'href', href);
}
function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function collectEvents(...htmlPages) {
  const events = new Map();
  for (const html of htmlPages) {
    const document = parse(html);
    walk(document, node => {
      if (node.tagName !== 'a') return;
      const href = attr(node, 'href') || '';
      if (!href.includes('/News-page/eventi/Dettaglio-Eventi/Evento/')) return;
      const title = find(node, item => item.tagName === 'h2');
      const place = find(node, item => item.tagName === 'h3');
      const date = find(node, item => item.tagName === 'h4');
      if (!title || !date) return;
      const match = text(date).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!match) return;
      events.set(href, { href, title: text(title).trim(), place: place ? text(place).trim() : '', date: text(date).trim(), day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) });
    });
  }
  return [...events.values()].sort((a, b) => a.month - b.month || a.day - b.day);
}
function generateCalendarPage(events, year, path) {
  const months = ['GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO', 'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE'];
  const monthHtml = months.map((name, monthIndex) => {
    const month = monthIndex + 1;
    const monthEvents = events.filter(event => event.year === year && event.month === month);
    const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const days = new Date(year, month, 0).getDate();
    const trailing = (7 - ((leading + days) % 7)) % 7;
    const cells = `${'<a class="disabled"></a>'.repeat(leading)}${Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const dayEvent = monthEvents.find(event => event.day === day);
      return `<a class="${dayEvent ? 'EventoEsistente' : 'DataVuota'} cursor-default"${dayEvent ? ` href="${escapeHtml(dayEvent.href)}"` : ''}><span>${day}</span></a>`;
    }).join('')}${'<a class="disabled"></a>'.repeat(trailing)}`;
    const eventLinks = monthEvents.map(event => `<a href="${escapeHtml(event.href)}"><span>${escapeHtml(event.date)} ${escapeHtml(event.place)}</span><br>${escapeHtml(event.title)}</a>`).join('');
    return `<input type="hidden" value="01/${String(month).padStart(2, '0')}/${year} 00:00:00"><div><div class="bg-Eventi"><div class="calendar-title white"><div class="row"><div class="col-lg-6">${name}</div></div></div><div class="calendar-content"><div class="row"><div class="col-lg-6"><div class="Calendar"><div class="container-fluid"><div class="row"><div class="col-md-12 no-padding">${['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(day => `<div class="day">${day}</div>`).join('')}</div></div><div class="row"><div class="col-md-12 no-padding border-calendar">${cells}</div></div></div></div></div><div class="col-lg-6 content-eventi">${eventLinks}</div></div></div></div></div>`;
  }).join('');
  const yearPath = target => target === currentYear ? '/CalendarioEventi' : `/CalendarioEventi?anno=${target}`;
  const html = `<div class="content-page-std"><div class="container"><div class="soci wowload delay-02 fadeIn"><div><div class="row"><div class="col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2"><div class="logo-eventi"><img src="https://noveporte.it/images/LogoPorta.png"></div><div class="row"><div class="col-lg-1 col-md-1 col-sm-1 hidden"><div class="line"></div></div><div class="col-lg-12 col-md-10 col-sm-10"><h1>CALENDARIO CAVALLERESCO ${year}</h1></div><div class="col-lg-1 col-md-1 col-sm-1 hidden"><div class="line"></div></div></div><div class="row"><div class="col-lg-6 col-md-6 col-sm-6"><div class="btn-eventi"><a href="${yearPath(year - 1)}">CALENDARIO ${year - 1}</a></div></div><div class="col-lg-6 col-md-6 col-sm-6"><div class="btn-eventi"><a href="${yearPath(year + 1)}">CALENDARIO ${year + 1}</a></div></div></div><article>${monthHtml}</article></div></div></div></div></div></div>`;
  return { path, title: `CALENDARIO CAVALLERESCO ${year}`, html };
}
async function savePage(page, pagesDir, manifest, key = page.path.toLowerCase()) {
  const file = `${keyFor(key)}.json`;
  await mkdir(pagesDir, { recursive: true });
  await writeFile(new URL(file, pagesDir), JSON.stringify(page), 'utf8');
  manifest.pages[key] = { path: page.path, title: page.title, file };
}

const eventGet = await request('/Eventi');
const eventHtml = await eventGet.text();
const eventFields = hiddenFields(eventHtml);
const celebratedResponse = await request('/Eventi', {
  method: 'POST',
  body: new URLSearchParams({ ...eventFields, __EVENTTARGET: 'ctl00$ContentPlaceHolder1$LnkEventiCelebrati', __EVENTARGUMENT: '' }),
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});
const celebratedHtml = await celebratedResponse.text();
const publicManifest = JSON.parse(await readFile(publicManifestFile, 'utf8'));

for (const [html, path, celebrated] of [[eventHtml, '/Eventi', false], [celebratedHtml, '/Eventi?tipo=celebrati', true]]) {
  const page = extractPage(html, path);
  const document = parse(page.html);
  replaceText(document, /CALENDARIO CAVALLERESCO\s+\d{4}/gi, `CALENDARIO CAVALLERESCO ${currentYear}`);
  setLink(document, celebrated ? 'ctl00_ContentPlaceHolder1_LnkEventiVenturi' : 'ctl00_ContentPlaceHolder1_LnkEventiCelebrati', celebrated ? '/Eventi' : '/Eventi?tipo=celebrati');
  setLink(document, 'ctl00_ContentPlaceHolder1_LnkBtn', '/CalendarioEventi');
  page.html = serializeOuter(find(document, node => ['content-page-std', 'content-page-std2'].some(name => hasClass(node, name))));
  await savePage(page, publicPages, publicManifest);
}
const events = collectEvents(eventHtml, celebratedHtml);
await writeFile(new URL('../public/content/calendar-events.json', import.meta.url), JSON.stringify(events.map(event => ({
  date: `${event.year}-${String(event.month).padStart(2, '0')}-${String(event.day).padStart(2, '0')}`,
  href: event.href,
  title: event.title,
  place: event.place,
})), null, 2), 'utf8');
for (const event of events) {
  if (publicManifest.pages[event.href.toLowerCase()]) continue;
  try {
    const response = await request(event.href);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const page = extractPage(await response.text(), event.href);
    await savePage(page, publicPages, publicManifest);
    console.log(`✓ ${event.title} (${event.date})`);
  } catch (error) {
    console.warn(`× ${event.title}: ${error.message}`);
  }
}
publicManifest.generatedAt = new Date().toISOString();
publicManifest.count = Object.keys(publicManifest.pages).length;
await writeFile(publicManifestFile, JSON.stringify(publicManifest, null, 2), 'utf8');
console.log(`✓ Eventi venturi e celebrati (${currentYear})`);

const privateManifest = JSON.parse(await readFile(privateManifestFile, 'utf8'));
for (let year = currentYear - 15; year <= currentYear + 2; year += 1) {
  const path = year === currentYear ? '/CalendarioEventi' : `/CalendarioEventi?anno=${year}`;
  await savePage(generateCalendarPage(events, year, path), privatePages, privateManifest, path.toLowerCase());
}
privateManifest.generatedAt = new Date().toISOString();
privateManifest.count = Object.keys(privateManifest.pages).length;
await writeFile(privateManifestFile, JSON.stringify(privateManifest, null, 2), 'utf8');
console.log(`✓ Calendari cavallereschi ${currentYear - 15}-${currentYear + 2}`);
