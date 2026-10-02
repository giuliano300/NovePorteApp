import postcss from '../node_modules/postcss/lib/postcss.mjs';
import selectorParser from '../node_modules/postcss-selector-parser/dist/index.js';
import { readFile, writeFile } from 'node:fs/promises';

const sourceFiles = [
  ['original-bootstrap.css', '../src/legacy-bootstrap.css'],
  ['original-Site.css', '../src/legacy-site.css'],
  ['original-Media.css', '../src/legacy-media.css'],
  ['https://noveporte.it/Css/Calendar.css', '../src/legacy-calendar.css'],
];

function repairLegacyCss(css) {
  let depth = 0;
  let quote = '';
  let comment = false;
  let result = '';

  for (let index = 0; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];
    if (comment) {
      result += char;
      if (char === '*' && next === '/') {
        result += next;
        index += 1;
        comment = false;
      }
      continue;
    }
    if (!quote && char === '/' && next === '*') {
      result += char + next;
      index += 1;
      comment = true;
      continue;
    }
    if (char === '"' || char === "'") {
      if (!quote) quote = char;
      else if (quote === char && css[index - 1] !== '\\') quote = '';
      result += char;
      continue;
    }
    if (!quote && char === '{') depth += 1;
    if (!quote && char === '}') {
      if (depth === 0) continue;
      depth -= 1;
    }
    result += char;
  }
  return result + '}'.repeat(depth);
}

function isInsideKeyframes(rule) {
  let parent = rule.parent;
  while (parent) {
    if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) return true;
    parent = parent.parent;
  }
  return false;
}

function prefixSelector(selector) {
  return selectorParser((selectors) => selectors.each((item) => {
    const first = item.at(0);
    if (first?.type === 'pseudo' && first.value === ':root') {
      first.replaceWith(selectorParser.className({ value: 'imported-content' }));
    } else {
      item.prepend(selectorParser.combinator({ value: ' ' }));
      item.prepend(selectorParser.className({ value: 'imported-content' }));
    }
  })).processSync(selector);
}

for (const [inputName, outputName] of sourceFiles) {
  const remote = /^https?:\/\//i.test(inputName);
  const inputUrl = remote ? new URL(inputName) : new URL(inputName, import.meta.url);
  const outputUrl = new URL(outputName, import.meta.url);
  const source = remote
    ? await fetch(inputUrl).then(response => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${inputUrl}`);
        return response.text();
      })
    : await readFile(inputUrl, 'utf8');
  const css = repairLegacyCss(source);
  const root = postcss.parse(css, { from: inputUrl.pathname });

  // Opera Presto keyframes are obsolete and modern bundlers interpret their
  // percentage blocks as invalid selectors. Standard/WebKit keyframes remain.
  root.walkAtRules((rule) => {
    if (rule.name.toLowerCase() === '-o-keyframes') rule.remove();
  });

  root.walkRules((rule) => {
    if (isInsideKeyframes(rule)) return;
    if (rule.selector.includes('%')) {
      rule.remove();
      return;
    }
    try {
      rule.selector = prefixSelector(rule.selector);
    } catch {
      rule.remove();
    }
  });

  root.walkDecls((declaration) => {
    declaration.value = declaration.value
      .replaceAll('../fonts/', '/assets/fonts/')
      .replace(/url\((['"]?)\/Fonts\/([^)'"?#]+)\1\)/gi, "url('/assets/fonts/$2')")
      .replace(/url\((['"]?)\/(?:Images|images)\/([^)'"?#]+)\1\)/gi, "url('/Images/$2')")
      .replace(/url\((['"]?)\/(Public\/[^)'"?#]+)\1\)/gi, "url('https://noveporte.it/$2')");
  });

  await writeFile(outputUrl, root.toString(), 'utf8');
  console.log(`Generato ${outputName}`);
}
