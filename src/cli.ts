#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { calculateOrbitState, DEFAULT_CONFIG } from './progression/orbit-state.js';
import type { ProgressionConfig } from './progression/orbit-state.js';
import { renderScene, renderError } from './renderer/scene.js';
import { normalizeActivity, validateUsername } from './github/activity.js';
import { collectActivity, GitHubError } from './github/client.js';
import { ActivityService, FileSnapshotStore } from './github/store.js';
import type { GitHubActivity, Theme } from './types.js';

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    demo: { type: 'boolean' }, fixture: { type: 'string' }, output: { type: 'string', short: 'o' },
    static: { type: 'boolean' }, theme: { type: 'string', default: 'transparent' },
    cache: { type: 'string', default: '.cache/orbit' }, refresh: { type: 'boolean' },
    config: { type: 'string' }, help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    console.log(`git-orbit <username> [options]

Generate a pixel-art GitHub constellation. SVG goes to stdout by default.

  --demo              Simulated example, no network or token
  --fixture PATH      Activity JSON or saved GitHub snapshot
  -o, --output PATH   Write SVG to a file (creates parent directories)
  --static            No animation
  --theme THEME       transparent (default), dark, light
  --cache DIR         Persistent activity cache (default: .cache/orbit)
  --refresh           Refresh the cached GitHub snapshot
  --config PATH       JSON overrides for progression weights/thresholds
  -h, --help          Show this help

Live data requires GITHUB_TOKEN or GH_TOKEN. No token is embedded in the image.
Example: node dist/src/cli.js mowhry --demo -o orbit.svg`);
    return;
  }
  if (positionals.length !== 1) throw new Error('Provide one GitHub username. See --help.');
  const username = validateUsername(positionals[0]!);
  if (!['transparent', 'dark', 'light'].includes(values.theme!)) throw new Error('Theme must be transparent, dark or light.');
  if (values.demo && values.fixture) throw new Error('Choose either --demo or --fixture.');
  let config: ProgressionConfig = DEFAULT_CONFIG;
  if (values.config) {
    const custom = JSON.parse(await readFile(values.config, 'utf8')) as Partial<ProgressionConfig>;
    config = { ...DEFAULT_CONFIG, ...custom, weights: { ...DEFAULT_CONFIG.weights, ...custom.weights } };
  }
  let svg: string;
  try {
    let activity: GitHubActivity;
    if (values.demo) {
      activity = { commits: 800, pullRequests: 50, reviews: 120, starsReceived: 75, accountAgeDays: 1800, currentStreak: 12 };
      console.error('git-orbit: offline demo — simulated activity.');
    } else if (values.fixture) {
      const fixture = JSON.parse(await readFile(values.fixture, 'utf8')) as Record<string, unknown>;
      activity = normalizeActivity(fixture.activity ?? fixture);
    } else {
      const service = new ActivityService(collectActivity, new FileSnapshotStore(values.cache!));
      const result = await service.get(username, values.refresh);
      activity = result.snapshot.activity;
      console.error(`git-orbit: ${result.source} GitHub snapshot from ${result.snapshot.fetchedAt}.`);
    }
    svg = renderScene(username, calculateOrbitState(activity, config), { theme: values.theme as Theme, animation: !values.static });
  } catch (error) {
    if (!(error instanceof GitHubError)) throw error;
    console.error(`git-orbit: ${error.message}`);
    svg = renderError(error.code === 'not_found' ? 'No signal — user not found' : 'No signal — GitHub unavailable');
    process.exitCode = 1;
  }
  if (values.output) {
    // A failed refresh must not replace a working committed image.
    if (process.exitCode) return;
    await mkdir(dirname(values.output), { recursive: true });
    await writeFile(values.output, svg);
    console.error(`git-orbit: wrote ${values.output}.`);
  } else process.stdout.write(svg);
}

main().catch(error => { console.error(`git-orbit: ${(error as Error).message}`); process.exitCode = 1; });
