import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, resolve, relative, isAbsolute } from 'node:path';

const distDirectory = resolve('dist');
const assetsDirectory = join(distDirectory, 'assets');
const html = await readFile(join(distDirectory, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(join(distDirectory, '.vite/manifest.json'), 'utf8'));
const manifestFiles = new Set();

for (const entry of Object.values(manifest)) {
  if (typeof entry.file === 'string') manifestFiles.add(entry.file);
  for (const file of entry.css || []) manifestFiles.add(file);
  for (const file of entry.assets || []) manifestFiles.add(file);
}

assert.ok(
  [...manifestFiles].some(file => file.startsWith('assets/three-vendor-')),
  'Vite asset manifest must include the isolated Three.js vendor chunk'
);

const scriptStart = html.indexOf('<script');
assert.notEqual(scriptStart, -1, 'production HTML must contain a module script');
const scriptEnd = html.indexOf('>', scriptStart);
assert.notEqual(scriptEnd, -1, 'production module script tag must be complete');
const scriptTag = html.slice(scriptStart, scriptEnd + 1);
const sourceStart = scriptTag.indexOf('src="');
assert.notEqual(sourceStart, -1, 'production module script must have a source');
const sourceValueStart = sourceStart + 5;
const sourceValueEnd = scriptTag.indexOf('"', sourceValueStart);
assert.notEqual(sourceValueEnd, -1, 'production module script source must be quoted');

let entryRelativePath = scriptTag.slice(sourceValueStart, sourceValueEnd);
if (entryRelativePath.startsWith('./')) entryRelativePath = entryRelativePath.slice(2);
if (entryRelativePath.startsWith('/')) entryRelativePath = entryRelativePath.slice(1);

const entryPath = resolve(distDirectory, entryRelativePath);
const entryFromDist = relative(distDirectory, entryPath);
assert.ok(entryFromDist && !entryFromDist.startsWith('..') && !isAbsolute(entryFromDist),
  'entry JavaScript must stay inside dist');

const entryName = basename(entryPath);
const entrySize = (await stat(entryPath)).size;
const javascriptFiles = (await readdir(assetsDirectory)).filter(name => name.endsWith('.js'));
const vendorName = javascriptFiles.find(name => name.startsWith('three-vendor-'));

assert.ok(vendorName, 'Three.js must be isolated in its own vendor chunk');
assert.ok(entrySize <= 30 * 1024, `initial JavaScript entry must stay at or below 30 KB (got ${entrySize} bytes)`);

const applicationChunks = javascriptFiles.filter(name => name !== entryName && name !== vendorName);
assert.ok(applicationChunks.length > 0, 'deferred application JavaScript chunk must exist');

const oversizedApplicationChunks = [];
for (const name of applicationChunks) {
  const size = (await stat(join(assetsDirectory, name))).size;
  if (size > 200 * 1024) oversizedApplicationChunks.push(`${name}: ${size} bytes`);
}
assert.deepEqual(oversizedApplicationChunks, [], 'deferred application chunks must stay at or below 200 KB');

console.log(`Entry JavaScript: ${(entrySize / 1024).toFixed(2)} KB`);
console.log(`Three.js vendor chunk: ${vendorName}`);
console.log(`Deferred application chunks: ${applicationChunks.length}`);
