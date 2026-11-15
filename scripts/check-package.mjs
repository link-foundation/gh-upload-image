#!/usr/bin/env node

// Verify the published artifact rather than just the source checkout.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'gh-upload-image-pack-'));
const expected = [
  'LICENSE',
  'README.md',
  'package.json',
  'src/cli.js',
  'src/index.d.ts',
  'src/index.js',
];

function pack(args) {
  return JSON.parse(
    execFileSync(
      process.execPath,
      [process.env.npm_execpath, 'pack', ...args],
      {
        cwd: root,
        encoding: 'utf8',
      }
    )
  )[0];
}

try {
  const dryRun = pack(['--dry-run', '--json']);
  assert.deepEqual(
    dryRun.files.map(({ path }) => path).sort(),
    expected,
    'The npm package must contain only runtime files, README, and LICENSE'
  );

  const packed = pack(['--json', '--pack-destination', temporary]);
  assert.deepEqual(packed.files, dryRun.files);
  execFileSync('tar', [
    '-xzf',
    join(temporary, packed.filename),
    '-C',
    temporary,
  ]);
  const packageRoot = join(temporary, 'package');

  // Reuse the existing suite against the extracted source. Only the test
  // framework comes from the checkout; the package has no runtime dependencies.
  const tests = readFileSync(join(root, 'tests/index.test.js'), 'utf8').replace(
    "from 'test-anywhere'",
    `from '${import.meta.resolve('test-anywhere')}'`
  );
  const testFile = join(packageRoot, 'packed.test.mjs');
  writeFileSync(
    testFile,
    tests.replace("from '../src/index.js'", "from './src/index.js'")
  );
  execFileSync(process.execPath, ['--test', testFile], {
    cwd: packageRoot,
    stdio: 'inherit',
  });

  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json')));
  const help = execFileSync(
    process.execPath,
    [join(packageRoot, manifest.bin['gh-upload-image']), '--help'],
    { cwd: packageRoot, encoding: 'utf8' }
  );
  assert.match(help, /USAGE:/);
  console.log(
    'Package preflight passed: six intended files; library and CLI work.'
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
