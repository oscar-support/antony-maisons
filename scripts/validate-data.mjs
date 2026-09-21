import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateDataset } from '../src/validation.js';

const path = resolve(process.argv[2] || 'data/listings.json');

try {
  const payload = JSON.parse(await readFile(path, 'utf8'));
  const result = validateDataset(payload);
  if (!result.valid) {
    console.error(`Invalid dataset: ${path}`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Valid dataset: ${path} (${payload.listings.length} listing${payload.listings.length === 1 ? '' : 's'})`);
  }
} catch (error) {
  console.error(`Unable to validate ${path}: ${error.message}`);
  process.exitCode = 1;
}
