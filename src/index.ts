export type { GitHubActivity, OrbitState, RenderOptions, ActivitySnapshot } from './types.js';
export { calculateOrbitState, DEFAULT_CONFIG } from './progression/orbit-state.js';
export type { ProgressionConfig } from './progression/orbit-state.js';
export { renderScene, renderError } from './renderer/scene.js';
export { normalizeActivity, validateUsername, retainProgress } from './github/activity.js';
export { collectActivity, GitHubError } from './github/client.js';
export { ActivityService, FileSnapshotStore } from './github/store.js';
