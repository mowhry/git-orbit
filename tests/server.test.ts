import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createOrbitServer } from '../src/server.js';
import { ActivityService } from '../src/github/store.js';
import { GitHubError } from '../src/github/client.js';

test('image endpoint serves SVG, themes, static output, ETags and valid error images', async () => {
  let calls = 0;
  const service = new ActivityService(async username => {
    calls++;
    if (username === 'missing') throw new GitHubError('no such user', 'not_found');
    return { version: 1, username, fetchedAt: new Date().toISOString(), activity:
      { commits: 800, pullRequests: 50, reviews: 120, starsReceived: 75, accountAgeDays: 1800 } };
  }, { read: async () => undefined, write: async () => {} });
  const server = createOrbitServer(service);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const image = await fetch(`${base}/api/orbit?username=mowhry&theme=dark&animation=false`);
    const svg = await image.text();
    assert.equal(image.status, 200); assert.match(image.headers.get('content-type')!, /image\/svg\+xml/);
    assert.match(svg, /#090e1c/); assert.doesNotMatch(svg, /@keyframes/);
    const cached = await fetch(`${base}/api/orbit?username=mowhry&theme=dark&animation=false`, { headers: { 'If-None-Match': image.headers.get('etag')! } });
    assert.equal(cached.status, 304);
    const count = calls;
    const demo = await fetch(`${base}/api/demo?username=octocat`);
    assert.equal(demo.headers.get('x-orbit-source'), 'demo'); assert.equal(calls, count);
    const missing = await fetch(`${base}/api/orbit?username=missing`);
    assert.equal(missing.status, 200); assert.equal(missing.headers.get('x-orbit-error'), 'not_found');
    assert.match(await missing.text(), /No signal/); assert.equal(missing.headers.get('cache-control'), 'no-store');
    const bad = await fetch(`${base}/api/orbit?username=../bad`);
    assert.equal(bad.headers.get('x-orbit-error'), 'invalid_request');
    assert.equal((await fetch(`${base}/api/orbit`, { method: 'POST' })).status, 405);
    const head = await fetch(`${base}/api/demo?username=mowhry`, { method: 'HEAD' });
    assert.equal(await head.text(), '');
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
