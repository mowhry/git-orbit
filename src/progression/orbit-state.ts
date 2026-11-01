import type { GitHubActivity, OrbitState } from '../types.js';
import { normalizeActivity } from '../github/activity.js';

export interface ProgressionConfig {
  weights: { commits: number; pullRequests: number; reviews: number };
  satelliteThresholds: readonly number[];
  maxSatellites: number;
  satellitesPerOrbit: number;
  maxOrbits: number;
  tierScoreThresholds: readonly number[];
  tierPullRequestThresholds: readonly number[];
  starThresholds: readonly number[];
  reviewThresholds: readonly number[];
  streakThresholds: readonly number[];
}

export const DEFAULT_CONFIG: ProgressionConfig = {
  weights: { commits: 1, pullRequests: 5, reviews: 3 },
  satelliteThresholds: [0, 50, 150, 300, 500, 750, 1000, 1350, 1800, 2400,
    3100, 4000, 5100, 6400, 8000, 10000, 12500, 15500, 19000, 23000, 28000],
  maxSatellites: 21, satellitesPerOrbit: 6, maxOrbits: 4,
  tierScoreThresholds: [0, 1800, 12000, 60000],
  tierPullRequestThresholds: [0, 25, 150, 750],
  starThresholds: [0, 10, 50, 100, 500, 1000],
  reviewThresholds: [0, 1, 20, 100],
  streakThresholds: [0, 3, 7, 30],
};

function level(value: number, thresholds: readonly number[]): number {
  return Math.max(0, thresholds.filter(t => value >= t).length - 1);
}

export function validateConfig(config: ProgressionConfig): void {
  for (const [name, thresholds] of Object.entries(config).filter(([, v]) => Array.isArray(v))) {
    const values = thresholds as number[];
    if (!values.length || values[0] !== 0 || values.some((v, i) =>
      !Number.isFinite(v) || v < 0 || (i > 0 && v <= values[i - 1]!))) {
      throw new Error(`${name} must start at 0 and contain strictly increasing finite thresholds.`);
    }
  }
  for (const n of Object.values(config.weights)) {
    if (!Number.isFinite(n) || n < 0) throw new Error('Score weights must be finite and nonnegative.');
  }
  if (![config.maxSatellites, config.satellitesPerOrbit, config.maxOrbits].every(n => Number.isInteger(n) && n > 0)
    || config.maxSatellites > 21 || config.maxOrbits > 4 || config.satellitesPerOrbit > 6
    || config.maxSatellites > config.maxOrbits * config.satellitesPerOrbit) {
    throw new Error('Layout supports up to 21 satellites, 4 orbits and 6 satellites per orbit.');
  }
}

export function calculateOrbitState(input: GitHubActivity, config = DEFAULT_CONFIG): OrbitState {
  validateConfig(config);
  const activity = normalizeActivity(input);
  // Stars enrich the sky; they NEVER buy satellites, even for very popular accounts.
  const score = Math.min(Number.MAX_SAFE_INTEGER,
    activity.commits * config.weights.commits + activity.pullRequests * config.weights.pullRequests
    + activity.reviews * config.weights.reviews);
  const satelliteCount = Math.min(config.maxSatellites, 1 + level(score, config.satelliteThresholds));
  return {
    score, satelliteCount,
    satelliteTier: Math.min(4, 1 + Math.max(level(score, config.tierScoreThresholds),
      level(activity.pullRequests, config.tierPullRequestThresholds))),
    orbitCount: Math.min(config.maxOrbits, Math.ceil(satelliteCount / config.satellitesPerOrbit)),
    orbitCapacity: config.satellitesPerOrbit,
    starDensity: Math.min(5, level(activity.starsReceived, config.starThresholds)),
    communicationLevel: Math.min(3, level(activity.reviews, config.reviewThresholds)),
    activityLevel: Math.min(3, level(activity.currentStreak ?? 0, config.streakThresholds)),
  };
}
