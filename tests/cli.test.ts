import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('CLI emits only SVG on stdout and supports offline fixtures', () => {
  const run = spawnSync(process.execPath, ['dist/src/cli.js', 'mowhry', '--fixture', 'fixtures/active.json', '--static'], { encoding: 'utf8' });
  assert.equal(run.status, 0); assert.ok(run.stdout.startsWith('<svg ')); assert.doesNotMatch(run.stdout, /@keyframes/);
  assert.equal(run.stderr, '');
});
test('CLI demo is labelled and is deterministic', () => {
  const command = ['dist/src/cli.js', 'mowhry', '--demo'];
  const a = spawnSync(process.execPath, command, { encoding: 'utf8' });
  const b = spawnSync(process.execPath, command, { encoding: 'utf8' });
  assert.equal(a.status, 0); assert.equal(a.stdout, b.stdout); assert.match(a.stderr, /simulated/);
});
test('a failed authenticated refresh preserves an existing output file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'orbit-cli-'));
  try {
    const output = join(dir, 'orbit.svg');
    await writeFile(output, 'existing constellation');
    const { GITHUB_TOKEN: _github, GH_TOKEN: _gh, ...env } = process.env;
    const run = spawnSync(process.execPath, ['dist/src/cli.js', 'mowhry', '--cache', join(dir, 'cache'), '-o', output], { env, encoding: 'utf8' });
    assert.equal(run.status, 1); assert.match(run.stderr, /GITHUB_TOKEN/);
    assert.equal(await readFile(output, 'utf8'), 'existing constellation');
    assert.equal(run.stdout, '');
  } finally { await rm(dir, { recursive: true }); }
});
