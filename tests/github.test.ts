import test from 'node:test';
import assert from 'node:assert/strict';
import { collectActivity, GitHubError, historyWindows } from '../src/github/client.js';
import { currentStreak, validateUsername } from '../src/github/activity.js';

test('history windows partition years without overlap, including leap days', () => {
  const windows = historyWindows('2023-12-31T17:00:00Z', new Date('2025-01-01T12:00:00Z'));
  assert.equal(windows.length, 3);
  assert.equal(windows[0]!.from, '2023-12-31T00:00:00.000Z');
  for (let i = 1; i < windows.length; i++) assert.equal(Date.parse(windows[i]!.from), Date.parse(windows[i - 1]!.to) + 1);
  assert.equal(Date.parse(windows[1]!.to) + 1 - Date.parse(windows[1]!.from), 366 * 86400000);
});

test('collector accumulates every year and paginates every repository', async () => {
  const calls: Record<string, unknown>[] = [];
  const mockFetch: typeof fetch = async (_url, options) => {
    const body = JSON.parse(options!.body as string) as { query: string; variables: Record<string, unknown> };
    calls.push(body.variables);
    assert.equal((options!.headers as Record<string, string>).authorization, 'Bearer test-token');
    let user: object;
    if (body.query.includes('OrbitAccount')) user = { createdAt: '2024-12-31T11:00:00Z' };
    else if (body.query.includes('OrbitRepositories')) user = { repositories: {
      nodes: [{ stargazerCount: body.variables.cursor ? 9 : 31 }],
      pageInfo: { hasNextPage: !body.variables.cursor, endCursor: body.variables.cursor ? null : 'page-2' },
    } };
    else user = { contributionsCollection: {
      totalCommitContributions: body.variables.from === '2025-01-01T00:00:00.000Z' ? 5 : 10,
      totalPullRequestContributions: 2, totalPullRequestReviewContributions: 3,
      contributionCalendar: { weeks: [{ contributionDays: ['2024-12-31', '2025-01-01', '2025-01-02'].map(date => ({ date, contributionCount: date.endsWith('02') ? 0 : 1 })) }] },
    } };
    return Response.json({ data: { user } });
  };
  const result = await collectActivity('Mowhry', { token: 'test-token', fetch: mockFetch, now: new Date('2025-01-02T12:00:00Z') });
  assert.equal(result.username, 'mowhry');
  assert.equal(result.activity.commits, 15); assert.equal(result.activity.pullRequests, 4);
  assert.equal(result.activity.reviews, 6); assert.equal(result.activity.starsReceived, 40);
  assert.equal(result.activity.currentStreak, 2); assert.equal(calls.length, 5);
});

test('a partial GraphQL response is never accepted as a complete account', async () => {
  const mockFetch: typeof fetch = async () => Response.json({ data: { user: { createdAt: '2020-01-01T00:00:00Z' } }, errors: [{ type: 'FORBIDDEN' }] });
  await assert.rejects(collectActivity('mowhry', { token: 'test', fetch: mockFetch }), { code: 'unavailable' });
});

test('missing accounts, bad tokens and rate limits have distinct failures', async () => {
  const responses: [Response, string][] = [
    [Response.json({ data: { user: null } }), 'not_found'],
    [Response.json({}, { status: 401 }), 'auth'],
    [Response.json({}, { status: 403, headers: { 'x-ratelimit-remaining': '0' } }), 'rate_limited'],
    [Response.json({ errors: [{ type: 'RATE_LIMITED' }] }), 'rate_limited'],
  ];
  for (const [response, code] of responses) await assert.rejects(
    collectActivity('mowhry', { token: 'test', fetch: async () => response }),
    error => error instanceof GitHubError && error.code === code,
  );
});

test('streak can end yesterday but cannot cross a missing day', () => {
  const days = new Map([['2024-02-28', 1], ['2024-02-29', 1], ['2024-03-01', 2]]);
  assert.equal(currentStreak(days, '2024-03-02'), 3);
  assert.equal(currentStreak(days, '2024-03-03'), 0);
  days.delete('2024-02-29'); assert.equal(currentStreak(days, '2024-03-02'), 1);
});

test('username validation blocks traversal and permits valid GitHub handles', () => {
  assert.equal(validateUsername('A-b9'), 'a-b9');
  for (const name of ['../x', '<svg>', 'a--b', '-bad', 'bad-', 'a'.repeat(40), '']) assert.throws(() => validateUsername(name));
});
