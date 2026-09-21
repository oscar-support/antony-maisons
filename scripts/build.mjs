import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDataset } from '../src/validation.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const publicDir = join(root, 'public');
const sourceDir = join(root, 'src');
const sourceData = join(root, 'data', 'listings.json');

let payload;
try {
  payload = JSON.parse(await readFile(sourceData, 'utf8'));
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new Error('Build: required data/listings.json is missing');
  }
  throw new Error(`Build: invalid JSON in data/listings.json (${error.message})`);
}
const validation = validateDataset(payload);
if (!validation.valid) {
  throw new Error(`Build: invalid data/listings.json (${validation.errors.slice(0, 3).join('; ')})`);
}

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'assets'), { recursive: true });
await mkdir(join(dist, 'data'), { recursive: true });
await cp(join(publicDir, 'index.html'), join(dist, 'index.html'));

const sourceFiles = await readdir(sourceDir, { withFileTypes: true });
for (const entry of sourceFiles) {
  if (!entry.isFile() || !/\.(?:js|css)$/.test(entry.name)) continue;
  await cp(join(sourceDir, entry.name), join(dist, 'assets', entry.name));
}

await cp(sourceData, join(dist, 'data', 'listings.json'));
console.log('Build: copied and validated data/listings.json');
console.log(`Build: ${dist}`);
