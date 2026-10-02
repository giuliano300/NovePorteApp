import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const localEnvironmentPath = fileURLToPath(new URL('./.env.local', import.meta.url));

if (existsSync(localEnvironmentPath)) {
  for (const rawLine of readFileSync(localEnvironmentPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const name = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[name] === undefined) process.env[name] = value;
  }
}

export const siteConfig = Object.freeze({
  host: '127.0.0.1',
  port: Number(process.env['NOVEPORTE_API_PORT'] || 4300),
  fortezzaPassword: process.env['NOVEPORTE_FORTEZZA_PASSWORD'] || '',
  websiteApiToken: process.env['NOVEPORTE_WEBSITE_API_TOKEN'] || '',
  appApiOrigin: (process.env['NOVEPORTE_APP_API_ORIGIN'] || '').replace(/\/$/, ''),
  appAssetOrigin: (process.env['NOVEPORTE_APP_ASSET_ORIGIN'] || '').replace(/\/$/, '')
});

export function validateSiteConfig() {
  const missing = [];
  if (!siteConfig.fortezzaPassword) missing.push('NOVEPORTE_FORTEZZA_PASSWORD');
  if (!siteConfig.websiteApiToken) missing.push('NOVEPORTE_WEBSITE_API_TOKEN');
  if (!siteConfig.appApiOrigin) missing.push('NOVEPORTE_APP_API_ORIGIN');
  if (!siteConfig.appAssetOrigin) missing.push('NOVEPORTE_APP_ASSET_ORIGIN');
  if (missing.length) throw new Error(`Configurazione mancante: ${missing.join(', ')}.`);
}
