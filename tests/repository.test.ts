import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('the profile workflow can commit both SVGs and persistent progress', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'orbit-repository-'));
  try {
    const git = (...args: string[]) => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' });
    git('init', '--quiet');
    await writeFile(join(directory, '.gitignore'), await readFile('.gitignore'));
    await mkdir(join(directory, 'output/.orbit-state'), { recursive: true });
    for (const file of ['output/orbit.svg', 'output/orbit-static.svg', 'output/.orbit-state/mowhry.json'])
      await writeFile(join(directory, file), 'workflow output');
    git('add', '--', 'output/orbit.svg', 'output/orbit-static.svg', 'output/.orbit-state');
    assert.deepEqual(git('ls-files').trim().split('\n'),
      ['output/.orbit-state/mowhry.json', 'output/orbit-static.svg', 'output/orbit.svg']);
    for (const file of ['.env', '.local/legacy-station/orbit.py', 'orbit.svg'])
      assert.equal(git('check-ignore', file).trim(), file);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
