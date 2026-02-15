import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env');
const outputPath = path.join(projectRoot, 'src', 'app', 'shared', 'app_env.ts');

const defaults = {
  APP_MODE: 'development',
  BACKEND_BASE_URL: 'http://localhost:5000',
};
const modeBaseUrls = {
  development: 'http://localhost:5000',
  production: 'https://kots.onrender.com',
};

function parseEnvFile(content) {
  const values = { ...defaults };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }
    const [rawKey, ...rest] = line.split('=');
    const key = rawKey.trim();
    const value = rest.join('=').trim();
    if (key) {
      values[key] = value;
    }
  }

  return values;
}

let parsed = { ...defaults };
if (fs.existsSync(envPath)) {
  parsed = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
}

const mode = (process.env.APP_MODE || parsed.APP_MODE || defaults.APP_MODE).toLowerCase();
const explicitBaseUrl = process.env.BACKEND_BASE_URL || parsed.BACKEND_BASE_URL;
const apiBaseUrl = explicitBaseUrl || modeBaseUrls[mode] || modeBaseUrls.development;
const output = `export const API_BASE_URL = '${apiBaseUrl}';\n`;

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`[env] Generated ${path.relative(projectRoot, outputPath)} in ${mode} mode`);
