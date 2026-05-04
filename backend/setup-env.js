/**
 * Bootstrap local .env from tracked template only (no secrets in this file).
 * Prefer: cp .env.example .env  then edit .env
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const examplePath = path.join(root, '.env.example');
const envPath = path.join(root, '.env');

if (!fs.existsSync(examplePath)) {
  console.error('Missing .env.example — cannot create .env');
  process.exit(1);
}

if (fs.existsSync(envPath)) {
  console.log('.env already exists — skipping (remove it first to regenerate from .env.example).');
  process.exit(0);
}

fs.copyFileSync(examplePath, envPath);
console.log('Created .env from .env.example — edit .env with real values.');
