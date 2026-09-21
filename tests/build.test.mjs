import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = resolve(root, 'dist');

test('build emits a relative static site without source or test files', () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'pipe' });

  assert.equal(existsSync(resolve(dist, 'index.html')), true);
  assert.equal(existsSync(resolve(dist, 'assets/app.js')), true);
  assert.equal(existsSync(resolve(dist, 'assets/styles.css')), true);
  assert.equal(existsSync(resolve(dist, 'data')), true);
  const index = readFileSync(resolve(dist, 'index.html'), 'utf8');
  assert.match(index, /\.\/assets\/app\.js/);
  assert.equal(existsSync(resolve(dist, 'package.json')), false);
  assert.equal(existsSync(resolve(dist, 'tests')), false);
  assert.equal(existsSync(resolve(dist, 'src')), false);
});

test('build fails when the required dataset is missing without deleting the previous dist', async () => {
  const project = await mkdtemp(resolve(tmpdir(), 'antony-build-missing-'));
  await cp(resolve(root, 'public'), resolve(project, 'public'), { recursive: true });
  await cp(resolve(root, 'src'), resolve(project, 'src'), { recursive: true });
  await cp(resolve(root, 'scripts', 'build.mjs'), resolve(project, 'scripts', 'build.mjs'));
  await mkdir(resolve(project, 'dist'), { recursive: true });
  await writeFile(resolve(project, 'dist', 'marker.txt'), 'keep me');

  assert.throws(
    () => execFileSync(process.execPath, [resolve(project, 'scripts', 'build.mjs')], { cwd: project, stdio: 'pipe' }),
    /required data\/listings\.json is missing/,
  );
  assert.equal(readFileSync(resolve(project, 'dist', 'marker.txt'), 'utf8'), 'keep me');
});

test('build validates the dataset before deleting an existing dist', async () => {
  const project = await mkdtemp(resolve(tmpdir(), 'antony-build-invalid-'));
  await cp(resolve(root, 'public'), resolve(project, 'public'), { recursive: true });
  await cp(resolve(root, 'src'), resolve(project, 'src'), { recursive: true });
  await cp(resolve(root, 'scripts', 'build.mjs'), resolve(project, 'scripts', 'build.mjs'));
  await mkdir(resolve(project, 'data'), { recursive: true });
  await writeFile(resolve(project, 'data', 'listings.json'), '{}');
  await mkdir(resolve(project, 'dist'), { recursive: true });
  await writeFile(resolve(project, 'dist', 'marker.txt'), 'keep me');

  assert.throws(
    () => execFileSync(process.execPath, [resolve(project, 'scripts', 'build.mjs')], { cwd: project, stdio: 'pipe' }),
    /invalid data\/listings\.json/,
  );
  assert.equal(readFileSync(resolve(project, 'dist', 'marker.txt'), 'utf8'), 'keep me');
});
