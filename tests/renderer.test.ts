import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrbitState, renderScene, renderError } from '../src/index.js';
import { createSatellites, position, TAU } from '../src/renderer/orbit.js';
import { readFile } from 'node:fs/promises';

const activity = { commits: 800, pullRequests: 50, reviews: 120, starsReceived: 75, accountAgeDays: 1800, currentStreak: 12 };
test('same normalized username and state produce identical SVG bytes', () => {
  const state = calculateOrbitState(activity);
  assert.equal(renderScene('mowhry', state), renderScene('mowhry', state));
  assert.equal(renderScene('MOWHRY', state), renderScene('mowhry', state));
  assert.deepEqual(createSatellites('Mowhry', state), createSatellites('mowhry', state));
  assert.notEqual(renderScene('mowhry', state), renderScene('octocat', state));
});
test('all satellites remain within the canvas for the entire orbit', () => {
  const state = calculateOrbitState({ ...activity, commits: 1e12 });
  for (const s of createSatellites('mowhry', state)) for (let i = 0; i < 360; i++) {
    const p = position(s.orbitIndex, TAU * i / 360);
    assert.ok(p.x >= 17 && p.x <= 383 && p.y >= 12 && p.y <= 188);
  }
});
test('the first satellite is visible in front of Earth, for every tested seed', () => {
  const state = calculateOrbitState({ ...activity, commits: 0, pullRequests: 0, reviews: 0 });
  for (let i = 0; i < 100; i++) {
    const s = createSatellites(`user-${i}`, state)[0]!;
    assert.ok(position(s.orbitIndex, s.angle).y >= 100);
  }
});
test('separate foreground and background preserve Earth occlusion', () => {
  const svg = renderScene('mowhry', calculateOrbitState(activity));
  assert.ok(svg.indexOf('data-layer="back"') < svg.indexOf('href="#earth"'));
  assert.ok(svg.indexOf('data-layer="front"') > svg.indexOf('href="#earth"'));
  assert.match(svg, /clip-path="url\(#front\)"/);
});
test('static export contains no animations; transparent export has no background', () => {
  const svg = renderScene('mowhry', calculateOrbitState(activity), { animation: false });
  assert.doesNotMatch(svg, /<style|<animate|@keyframes|<script|foreignObject/);
  assert.doesNotMatch(svg, /fill="#090e1c"/);
});
test('animated SVG is self-contained and lightweight even at the cap', () => {
  const svg = renderScene('mowhry', calculateOrbitState({ ...activity, commits: 1e12 }));
  assert.doesNotMatch(svg, /<script|foreignObject|(?:href|src)="https?:/);
  assert.match(svg, /prefers-reduced-motion/);
  assert.ok(Buffer.byteLength(svg) < 210000, `SVG too large: ${Buffer.byteLength(svg)}`);
  assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
});
test('untrusted labels cannot inject markup', () => {
  const name = '<script>alert("x")</script>';
  assert.doesNotMatch(renderScene(name, calculateOrbitState(activity)), /<script>/);
  assert.doesNotMatch(renderError(name), /<script>/);
});

test('reviewed example SVGs remain byte-identical to the renderer', async () => {
  for (const name of ['new', 'active', 'veteran', 'extreme']) {
    const metrics = JSON.parse(await readFile(`fixtures/${name}.json`, 'utf8'));
    const expected = await readFile(`examples/constellations/${name}-static.svg`, 'utf8');
    assert.equal(renderScene('mowhry', calculateOrbitState(metrics), { animation: false }), expected);
  }
});
