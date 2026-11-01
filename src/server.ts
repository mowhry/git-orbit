import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { calculateOrbitState } from './progression/orbit-state.js';
import { renderError, renderScene } from './renderer/scene.js';
import { validateUsername } from './github/activity.js';
import { collectActivity, GitHubError } from './github/client.js';
import { ActivityService, FileSnapshotStore } from './github/store.js';
import type { Theme } from './types.js';

const demoActivity = { commits: 800, pullRequests: 50, reviews: 120, starsReceived: 75, accountAgeDays: 1800, currentStreak: 12 };

export function createOrbitServer(service = new ActivityService(collectActivity,
  new FileSnapshotStore(process.env.ORBIT_CACHE_DIR ?? '.cache/orbit'))) {
  async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '/', 'http://localhost');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    if (!['GET', 'HEAD'].includes(request.method ?? '')) {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    if (url.pathname === '/health') {
      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('ok\n'); return;
    }
    if (!['/api/orbit', '/api/demo'].includes(url.pathname)) {
      response.writeHead(url.pathname === '/' ? 200 : 404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Git Orbit\n\n/api/orbit?username=octocat&theme=transparent&animation=true\n/api/demo?username=octocat (simulated activity)\n'); return;
    }
    let svg: string;
    let source = 'demo';
    let errorCode = '';
    try {
      const username = validateUsername(url.searchParams.get('username') ?? '');
      const theme = url.searchParams.get('theme') ?? 'transparent';
      const animation = url.searchParams.get('animation') ?? 'true';
      if (!['transparent', 'dark', 'light'].includes(theme)) throw new Error('Unknown theme');
      if (!['true', 'false'].includes(animation)) throw new Error('Unknown animation option');
      let activity = demoActivity;
      if (url.pathname === '/api/orbit') {
        const result = await service.get(username);
        activity = { ...result.snapshot.activity, currentStreak: result.snapshot.activity.currentStreak ?? 0 };
        source = result.source;
      }
      svg = renderScene(username, calculateOrbitState(activity), { theme: theme as Theme, animation: animation === 'true' });
    } catch (error) {
      errorCode = error instanceof GitHubError ? error.code : 'invalid_request';
      svg = renderError(errorCode === 'not_found' ? 'No signal — user not found'
        : errorCode === 'invalid_request' ? 'No signal — check the image URL' : 'No signal — GitHub unavailable');
    }
    const etag = `"${createHash('sha256').update(svg).digest('hex')}"`;
    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    response.setHeader('Cache-Control', errorCode ? 'no-store' : source === 'stale' ? 'public, max-age=60' : 'public, max-age=1800');
    if (errorCode) response.setHeader('X-Orbit-Error', errorCode);
    else {
      response.setHeader('X-Orbit-Source', source);
      response.setHeader('ETag', etag);
      if (request.headers['if-none-match'] === etag) { response.writeHead(304); response.end(); return; }
    }
    // Image endpoints return a valid image even on failure, including through image proxies.
    response.writeHead(200);
    response.end(request.method === 'HEAD' ? undefined : svg);
  }
  return createServer((request, response) => {
    handle(request, response).catch(() => {
      if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' });
      response.end(renderError());
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
  const host = process.env.HOST ?? '127.0.0.1';
  const server = createOrbitServer();
  server.listen(port, host, () => console.log(`Git Orbit: http://${host}:${port}/api/demo?username=mowhry`));
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close());
}
