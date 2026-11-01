import type { ActivitySnapshot } from '../types.js';
import { currentStreak, normalizeActivity, validateUsername } from './activity.js';

export class GitHubError extends Error {
  constructor(message: string, public readonly code: 'not_found' | 'auth' | 'rate_limited' | 'unavailable') {
    super(message); this.name = 'GitHubError';
  }
}

export interface CollectorOptions { token?: string; fetch?: typeof fetch; now?: Date }

const ACCOUNT = `query OrbitAccount($login:String!){user(login:$login){createdAt}}`;
const REPOSITORIES = `query OrbitRepositories($login:String!,$cursor:String){user(login:$login){
  repositories(first:100,after:$cursor,ownerAffiliations:[OWNER],privacy:PUBLIC){
    nodes{stargazerCount} pageInfo{hasNextPage endCursor}
  }
}}`;
const HISTORY = `query OrbitHistory($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){
  contributionsCollection(from:$from,to:$to){
    totalCommitContributions totalPullRequestContributions totalPullRequestReviewContributions
    contributionCalendar{weeks{contributionDays{date contributionCount}}}
  }
}}`;

/** Disjoint calendar-year windows: inclusive API endpoints, no skipped Jan 1 or leap day. */
export function historyWindows(createdAt: string, now: Date): { from: string; to: string }[] {
  const created = new Date(createdAt);
  if (!Number.isFinite(created.getTime()) || !Number.isFinite(now.getTime()) || created > now || created.getUTCFullYear() < 2007) {
    throw new GitHubError('GitHub returned an invalid account date.', 'unavailable');
  }
  const windows = [];
  for (let year = created.getUTCFullYear(); year <= now.getUTCFullYear(); year++) {
    const start = Math.max(Date.UTC(year, 0, 1), Date.parse(createdAt.slice(0, 10) + 'T00:00:00Z'));
    const end = Math.min(Date.UTC(year + 1, 0, 1) - 1, now.getTime());
    windows.push({ from: new Date(start).toISOString(), to: new Date(end).toISOString() });
  }
  return windows;
}

function apiCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new GitHubError('GitHub returned incomplete activity data.', 'unavailable');
  return value;
}

export async function collectActivity(rawUsername: string, options: CollectorOptions = {}): Promise<ActivitySnapshot> {
  const username = validateUsername(rawUsername);
  const token = options.token ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (!token) throw new GitHubError('Set GITHUB_TOKEN or GH_TOKEN to read GitHub activity. Use --demo for an offline preview.', 'auth');
  const fetcher = options.fetch ?? fetch;
  const now = options.now ?? new Date();
  async function query<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    let response: Response;
    try {
      response = await fetcher('https://api.github.com/graphql', {
        method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'git-orbit/0.1' },
        body: JSON.stringify({ query, variables: { login: username, ...variables } }), signal: AbortSignal.timeout(15000),
      });
    } catch { throw new GitHubError('GitHub is temporarily unreachable.', 'unavailable'); }
    if (response.status === 401) throw new GitHubError('GitHub rejected the token.', 'auth');
    if (response.status === 429 || (response.status === 403 && (response.headers.get('x-ratelimit-remaining') === '0' || response.headers.has('retry-after'))))
      throw new GitHubError('GitHub rate limit reached. Try again later.', 'rate_limited');
    if (!response.ok) throw new GitHubError(`GitHub request failed (HTTP ${response.status}).`, 'unavailable');
    let body: { data?: T; errors?: { type?: string }[] };
    try { body = await response.json() as typeof body; }
    catch { throw new GitHubError('GitHub returned invalid JSON.', 'unavailable'); }
    if (!body || typeof body !== 'object' || (body.errors !== undefined && !Array.isArray(body.errors)))
      throw new GitHubError('GitHub returned invalid response data.', 'unavailable');
    if (body.errors?.length) {
      const types = body.errors.map(e => e.type);
      if (types.includes('NOT_FOUND')) throw new GitHubError('GitHub user not found.', 'not_found');
      if (types.includes('RATE_LIMITED')) throw new GitHubError('GitHub rate limit reached. Try again later.', 'rate_limited');
      // Never use partial GraphQL data, nor echo server messages which may include token details.
      throw new GitHubError('GitHub returned an incomplete response.', 'unavailable');
    }
    if (!body.data) throw new GitHubError('GitHub returned no data.', 'unavailable');
    return body.data;
  }
  const account = await query<{ user: { createdAt: string } | null }>(ACCOUNT, {});
  if (!account.user) throw new GitHubError('GitHub user not found.', 'not_found');
  const windows = historyWindows(account.user.createdAt, now);
  let starsReceived = 0;
  let cursor: string | null = null;
  const seenCursors = new Set<string>();
  do {
    type Repos = { user: { repositories: { nodes: { stargazerCount: number }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } };
    const data: Repos = await query<Repos>(REPOSITORIES, { cursor });
    const repositories = data.user?.repositories;
    if (!Array.isArray(repositories?.nodes) || typeof repositories.pageInfo?.hasNextPage !== 'boolean')
      throw new GitHubError('GitHub returned incomplete repositories.', 'unavailable');
    for (const repo of repositories.nodes) starsReceived += apiCount(repo?.stargazerCount);
    if (!repositories.pageInfo.hasNextPage) break;
    cursor = repositories.pageInfo.endCursor;
    if (!cursor || seenCursors.has(cursor)) throw new GitHubError('GitHub repository pagination did not advance.', 'unavailable');
    seenCursors.add(cursor);
  } while (true);
  let commits = 0, pullRequests = 0, reviews = 0;
  const days = new Map<string, number>();
  for (const window of windows) {
    type History = { user: { contributionsCollection: {
      totalCommitContributions: number; totalPullRequestContributions: number; totalPullRequestReviewContributions: number;
      contributionCalendar: { weeks: { contributionDays: { date: string; contributionCount: number }[] }[] };
    } } };
    const data = await query<History>(HISTORY, window);
    const collection = data.user?.contributionsCollection;
    commits += apiCount(collection?.totalCommitContributions);
    pullRequests += apiCount(collection?.totalPullRequestContributions);
    reviews += apiCount(collection?.totalPullRequestReviewContributions);
    if (!Array.isArray(collection?.contributionCalendar?.weeks)) throw new GitHubError('GitHub returned no calendar.', 'unavailable');
    for (const week of collection.contributionCalendar.weeks) {
      if (!Array.isArray(week?.contributionDays)) throw new GitHubError('GitHub returned an incomplete calendar.', 'unavailable');
      for (const day of week.contributionDays) {
      if (!day || typeof day.date !== 'string') throw new GitHubError('GitHub returned an invalid calendar day.', 'unavailable');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date)) throw new GitHubError('GitHub returned an invalid calendar date.', 'unavailable');
      if (day.date >= window.from.slice(0, 10) && day.date <= window.to.slice(0, 10)) days.set(day.date, apiCount(day.contributionCount));
      }
    }
  }
  const activity = normalizeActivity({ commits, pullRequests, reviews, starsReceived,
    accountAgeDays: Math.floor((now.getTime() - Date.parse(account.user.createdAt)) / 86_400_000),
    currentStreak: currentStreak(days, now.toISOString().slice(0, 10)),
  });
  return { version: 1, username, fetchedAt: now.toISOString(), activity };
}
