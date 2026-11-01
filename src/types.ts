/** Normalized, cumulative activity. No GitHub response objects reach the renderer. */
export interface GitHubActivity {
  commits: number;
  pullRequests: number;
  reviews: number;
  starsReceived: number;
  accountAgeDays: number;
  currentStreak?: number;
}

export interface OrbitState {
  score: number;
  satelliteCount: number;
  satelliteTier: number;
  orbitCount: number;
  orbitCapacity: number;
  starDensity: number;
  communicationLevel: number;
  activityLevel: number;
}

export interface Satellite {
  id: number;
  orbitIndex: number;
  angle: number;
  speed: number;
  tier: number;
  variant: number;
}

export type Theme = 'transparent' | 'dark' | 'light';
export interface RenderOptions { theme?: Theme; animation?: boolean }

export interface ActivitySnapshot {
  version: 1;
  username: string;
  fetchedAt: string;
  activity: GitHubActivity;
}
