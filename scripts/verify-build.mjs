import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const distDirectory = resolve('dist');
const assetsDirectory = join(distDirectory, 'assets');
const html = await readFile(join(distDirectory, 'index.html'), 'utf8');
const entryMatch = html.match(/<script\\b[^>]*\\bsrc=["']([^"']+\\.js)["'][^>]*>/i);

assert.ok(entryMatch, 'production HTML must reference an entry JavaScript file');

const entryRelativePath = entryMatch[1].replace(/^\\.\\//, '').replace(/^\\//, '');
const entryPath = resolve(distDirectory, entryRelativePath);
assert.ok(entryPath.startsWith(distDirectory), 'entry JavaScript must stay inside dist');
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
