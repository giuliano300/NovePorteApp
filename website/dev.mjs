import { spawn } from 'node:child_process';
import { validateSiteConfig } from './config.mjs';

try {
  validateSiteConfig();
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Configurazione del sito non valida.');
  process.exit(1);
}

const api = spawn(process.execPath, ['server.mjs'], { stdio: 'inherit', env: process.env });
const angular = spawn(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'serve', '--host=127.0.0.1', '--port=4201', '--proxy-config=proxy.conf.json'], { stdio: 'inherit', env: process.env });
const stop = () => { api.kill(); angular.kill(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
api.on('exit', code => { if (code) { angular.kill(); process.exit(code); } });
angular.on('exit', code => { api.kill(); process.exit(code || 0); });
