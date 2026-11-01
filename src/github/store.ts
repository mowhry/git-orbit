import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ActivitySnapshot } from '../types.js';
import { normalizeActivity, retainProgress, validateUsername } from './activity.js';
import { GitHubError } from './client.js';

export interface SnapshotStore {
  read(username: string): Promise<ActivitySnapshot | undefined>;
  write(snapshot: ActivitySnapshot): Promise<void>;
}

export class FileSnapshotStore implements SnapshotStore {
  constructor(private readonly directory: string) {}
  async read(username: string): Promise<ActivitySnapshot | undefined> {
    username = validateUsername(username);
    let raw: string;
    try {
      raw = await readFile(join(this.directory, `${username}.json`), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
    // A malformed cache entry can be rebuilt; filesystem permission errors cannot.
    try {
      const data = JSON.parse(raw) as ActivitySnapshot;
      if (data?.version !== 1 || data.username !== username || !Number.isFinite(Date.parse(data.fetchedAt))) return undefined;
      return { ...data, activity: normalizeActivity(data.activity) };
    } catch { return undefined; }
  }
  async write(snapshot: ActivitySnapshot): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const target = join(this.directory, `${validateUsername(snapshot.username)}.json`);
    const temp = `${target}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(snapshot, null, 2) + '\n', { mode: 0o600 });
    await rename(temp, target);
  }
}

export type SnapshotLoader = (username: string) => Promise<ActivitySnapshot>;
export interface ActivityResult { snapshot: ActivitySnapshot; source: 'live' | 'cache' | 'stale' }

/** Coalesce concurrent requests and fall back only on transient GitHub failures. */
export class ActivityService {
  private readonly pending = new Map<string, Promise<ActivityResult>>();
  constructor(private readonly load: SnapshotLoader, private readonly store: SnapshotStore,
    private readonly ttlMs = 30 * 60 * 1000, private readonly now = () => Date.now()) {}

  get(rawUsername: string, refresh = false): Promise<ActivityResult> {
    const username = validateUsername(rawUsername);
    const existing = this.pending.get(username);
    if (existing) return existing;
    const promise = this.resolve(username, refresh).finally(() => this.pending.delete(username));
    this.pending.set(username, promise);
    return promise;
  }
  private async resolve(username: string, refresh: boolean): Promise<ActivityResult> {
    const previous = await this.store.read(username);
    const age = previous ? this.now() - Date.parse(previous.fetchedAt) : Infinity;
    if (!refresh && previous && age >= 0 && age < this.ttlMs) return { snapshot: previous, source: 'cache' };
    let snapshot: ActivitySnapshot;
    try { snapshot = await this.load(username); }
    catch (error) {
      if (previous && error instanceof GitHubError && ['rate_limited', 'unavailable'].includes(error.code))
        return { snapshot: previous, source: 'stale' };
      throw error;
    }
    snapshot = { ...snapshot, activity: retainProgress(snapshot.activity, previous?.activity) };
    await this.store.write(snapshot);
    return { snapshot, source: 'live' };
  }
}
