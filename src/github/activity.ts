import type { GitHubActivity } from '../types.js';

export function validateUsername(value: string): string {
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value)) {
    throw new Error('Invalid GitHub username (1–39 letters, digits or single hyphens).');
  }
  return value.toLowerCase();
}

export function normalizeActivity(value: unknown): GitHubActivity {
  if (!value || typeof value !== 'object') throw new Error('Expected a GitHub activity object.');
  const input = value as Record<string, unknown>;
  const result: Record<string, number> = {};
  for (const key of ['commits', 'pullRequests', 'reviews', 'starsReceived', 'accountAgeDays', 'currentStreak']) {
    const n = input[key] ?? (key === 'currentStreak' ? 0 : undefined);
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) {
      throw new Error(`Activity field ${key} must be a finite, nonnegative number.`);
    }
    result[key] = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(n));
  }
  return result as unknown as GitHubActivity;
}

/** Keep earned hardware when API visibility changes; temporary signals remain current. */
export function retainProgress(current: GitHubActivity, previous?: GitHubActivity): GitHubActivity {
  if (!previous) return current;
  return {
    ...current,
    commits: Math.max(current.commits, previous.commits),
    pullRequests: Math.max(current.pullRequests, previous.pullRequests),
    reviews: Math.max(current.reviews, previous.reviews),
  };
}

export function currentStreak(days: Map<string, number>, today: string): number {
  let time = Date.parse(`${today}T00:00:00Z`);
  const day = () => new Date(time).toISOString().slice(0, 10);
  if (!(days.get(day())! > 0)) time -= 86_400_000;
  let streak = 0;
  while ((days.get(day()) ?? 0) > 0) { streak++; time -= 86_400_000; }
  return streak;
}
