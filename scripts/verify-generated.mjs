import { spawnSync } from 'node:child_process';

// Regenerate in dependency order: drawings -> embedded module -> build -> examples.
for (const script of ['scripts/build-assets.mjs', 'node_modules/typescript/bin/tsc', 'dist/scripts/examples.js']) {
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const paths = ['assets/earth', 'assets/satellites', 'assets/effects',
  'src/renderer/assets.generated.ts', 'examples/constellations'];
const result = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '--', ...paths], { encoding: 'utf8' });
if (result.error) throw result.error;
if (result.status !== 0) { process.stderr.write(result.stderr); process.exit(result.status ?? 1); }
if (result.stdout.trim()) {
  console.error('Generated files differ from the committed source:\n' + result.stdout.trim());
  console.error('Run npm run assets && npm run demo, then commit the generated files.');
  process.exit(1);
}
console.log('All generated assets and examples are reproducible.');
