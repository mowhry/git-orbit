import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ActivityService, FileSnapshotStore, type SnapshotStore } from '../src/github/store.js';
import { GitHubError } from '../src/github/client.js';
import type { ActivitySnapshot } from '../src/types.js';

const snapshot: ActivitySnapshot = { version: 1, username: 'mowhry', fetchedAt: '2026-11-01T10:00:00Z',
  activity: { commits: 1000, pullRequests: 30, reviews: 40, starsReceived: 20, accountAgeDays: 900, currentStreak: 7 } };
function memory(initial?: ActivitySnapshot): SnapshotStore {
  let value = initial;
  return { read: async () => value, write: async v => { value = v; } };
}
test('fresh cache avoids API calls and simultaneous misses are coalesced', async () => {
  let calls = 0;
  const load = async () => { calls++; return snapshot; };
  const store = memory();
  const service = new ActivityService(load, store, 1800000, () => Date.parse(snapshot.fetchedAt));
  const result = await Promise.all([service.get('mowhry'), service.get('Mowhry'), service.get('mowhry')]);
  assert.equal(calls, 1); assert.equal(result[0]!.source, 'live');
  assert.equal((await service.get('mowhry')).source, 'cache'); assert.equal(calls, 1);
});
test('expired data survives temporary errors but not missing accounts or rejected tokens', async () => {
  for (const code of ['unavailable', 'rate_limited', 'not_found', 'auth'] as const) {
    const service = new ActivityService(async () => { throw new GitHubError('test', code); }, memory(snapshot), 0);
    if (code === 'unavailable' || code === 'rate_limited') assert.equal((await service.get('mowhry')).source, 'stale');
    else await assert.rejects(service.get('mowhry'), { code });
  }
});
test('refresh retains hardware and updates temporary signals', async () => {
  const service = new ActivityService(async () => ({ ...snapshot, activity: { ...snapshot.activity, commits: 0, currentStreak: 0 } }), memory(snapshot), 0);
  const result = await service.get('mowhry');
  assert.equal(result.snapshot.activity.commits, 1000); assert.equal(result.snapshot.activity.currentStreak, 0);
});
test('file cache persists and corrupt JSON is ignored', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'orbit-store-'));
  try {
    const store = new FileSnapshotStore(dir);
    assert.equal(await store.read('mowhry'), undefined);
    await store.write(snapshot); assert.deepEqual(await new FileSnapshotStore(dir).read('mowhry'), snapshot);
    await writeFile(join(dir, 'mowhry.json'), '{broken'); assert.equal(await store.read('mowhry'), undefined);
    await writeFile(join(dir, 'mowhry.json'), JSON.stringify({ ...snapshot, activity: null }));
    assert.equal(await store.read('mowhry'), undefined);
  } finally { await rm(dir, { recursive: true }); }
});
