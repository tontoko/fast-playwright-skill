import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

console.log('Installing dependencies...');
execSync('npm install', { cwd: ROOT_DIR, stdio: 'inherit' });

console.log('Installing Playwright chromium browser...');
execSync('npx playwright install chromium', { cwd: ROOT_DIR, stdio: 'inherit' });

console.log('Setup complete.');
