import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrbitState, DEFAULT_CONFIG, normalizeActivity, retainProgress } from '../src/index.js';
import type { GitHubActivity } from '../src/types.js';
import { readFile } from 'node:fs/promises';
import { renderScene } from '../src/renderer/scene.js';

const zero: GitHubActivity = { commits: 0, pullRequests: 0, reviews: 0, starsReceived: 0, accountAgeDays: 0 };

test('a new user starts with one basic satellite', () => {
  const s = calculateOrbitState(zero);
  assert.equal(s.satelliteCount, 1); assert.equal(s.orbitCount, 1); assert.equal(s.satelliteTier, 1);
});
test('progression boundaries and independent weights', () => {
  for (const [commits, count] of [[49, 1], [50, 2], [149, 2], [150, 3], [300, 4], [750, 6]])
    assert.equal(calculateOrbitState({ ...zero, commits: commits! }).satelliteCount, count);
  assert.equal(calculateOrbitState({ ...zero, commits: 800, pullRequests: 50, reviews: 120 }).score, 1410);
});
test('stars and streaks never buy hardware', () => {
  const s = calculateOrbitState({ ...zero, starsReceived: 1e12, currentStreak: 1000 });
  assert.equal(s.satelliteCount, 1); assert.equal(s.satelliteTier, 1); assert.equal(s.score, 0);
  assert.equal(s.starDensity, 5); assert.equal(s.activityLevel, 3);
});
test('pull requests upgrade hardware; reviews enable communications', () => {
  assert.equal(calculateOrbitState({ ...zero, pullRequests: 25 }).satelliteTier, 2);
  assert.equal(calculateOrbitState({ ...zero, reviews: 120 }).communicationLevel, 3);
});
test('more cumulative activity cannot remove permanent progress', () => {
  let before = calculateOrbitState(zero);
  for (let n = 0; n < 100000; n += 73) {
    const s = calculateOrbitState({ ...zero, commits: n, pullRequests: n / 100, reviews: n / 10 });
    assert.ok(s.satelliteCount >= before.satelliteCount && s.satelliteCount <= 21);
    assert.ok(s.satelliteTier >= before.satelliteTier && s.satelliteTier <= 4);
    assert.ok(s.orbitCount >= before.orbitCount && s.orbitCount <= 4);
    before = s;
  }
});
test('extreme values saturate, and progress continues after satellite cap', () => {
  const s = calculateOrbitState({ ...zero, commits: Number.MAX_VALUE });
  assert.ok(Number.isFinite(s.score)); assert.equal(s.satelliteCount, 21); assert.equal(s.satelliteTier, 4);
  assert.equal(calculateOrbitState({ ...zero, commits: 50000 }).satelliteTier, 3);
  assert.equal(calculateOrbitState({ ...zero, commits: 60000 }).satelliteTier, 4);
});
test('progression can be tuned independently of the renderer', () => {
  const s = calculateOrbitState({ ...zero, commits: 5 }, { ...DEFAULT_CONFIG,
    weights: { commits: 10, pullRequests: 0, reviews: 0 }, satellitesPerOrbit: 2, maxSatellites: 8 });
  assert.equal(s.satelliteCount, 2); assert.equal(s.orbitCapacity, 2);
  assert.throws(() => calculateOrbitState(zero, { ...DEFAULT_CONFIG, satelliteThresholds: [0, 50, 10] }));
  assert.throws(() => calculateOrbitState(zero, { ...DEFAULT_CONFIG, maxSatellites: 22 }));
});
test('inactivity and restricted visibility preserve previously earned hardware', () => {
  const previous = { ...zero, commits: 9000, reviews: 300, currentStreak: 30 };
  const saved = retainProgress({ ...zero, commits: 10 }, previous);
  assert.equal(saved.commits, 9000); assert.equal(saved.reviews, 300); assert.equal(saved.currentStreak, undefined);
  assert.equal(calculateOrbitState(saved).satelliteCount, calculateOrbitState(previous).satelliteCount);
});
test('bad fixture metrics are rejected instead of generating malformed SVG', () => {
  for (const n of [-1, NaN, Infinity, '12', null])
    assert.throws(() => normalizeActivity({ ...zero, commits: n }));
});

test('gallery grows through an intermediate stage and caps at the former veteran scene', async () => {
  const states = await Promise.all(['new', 'active', 'growing', 'veteran', 'extreme'].map(async name =>
    calculateOrbitState(normalizeActivity(JSON.parse(await readFile(`fixtures/${name}.json`, 'utf8'))))));
  assert.deepEqual(states.map(s => s.satelliteCount), [1, 8, 14, 21, 21]);
  assert.deepEqual(states.map(s => s.orbitCount), [1, 2, 3, 4, 4]);
  assert.deepEqual(states.map(s => s.satelliteTier), [1, 2, 3, 4, 4]);
  assert.equal(renderScene('mowhry', states[3]!), renderScene('mowhry', states[4]!),
    'extreme activity must not make the final scene busier');
});
