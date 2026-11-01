import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { calculateOrbitState, renderScene, normalizeActivity } from '../src/index.js';

await mkdir('examples/constellations', { recursive: true });
for (const name of ['new', 'active', 'veteran', 'extreme']) {
  const activity = normalizeActivity(JSON.parse(await readFile(`fixtures/${name}.json`, 'utf8')));
  const state = calculateOrbitState(activity);
  for (const theme of ['transparent', 'dark', 'light'] as const) {
    await writeFile(`examples/constellations/${name}-${theme}.svg`, renderScene('mowhry', state, { theme }));
  }
  await writeFile(`examples/constellations/${name}-static.svg`, renderScene('mowhry', state, { animation: false }));
  console.log(`${name}: ${state.satelliteCount} satellites, ${state.orbitCount} orbits, tier ${state.satelliteTier}`);
}
await writeFile('examples/constellations/index.html', `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Git Orbit — exemples</title><style>body{margin:40px auto;max-width:1000px;padding:0 24px;background:#090e1c;color:#d5deeb;font:16px system-ui}h1{font-weight:500}p{color:#8d9ab0}img{width:100%;display:block}section{margin:40px 0;border:1px solid #263247;border-radius:12px;overflow:hidden}h2{padding:0 24px;font-size:16px;font-weight:500}.light{background:#f5f6f8;color:#263247}a{color:#99d5df}</style><h1>Git Orbit</h1><p>Quatre étapes de vie. Données simulées, même graine « mowhry ».</p>${['new', 'active', 'veteran', 'extreme'].map((name, i) => `<section><h2>${['Premier satellite', 'Constellation active', 'Voyage au long cours', 'Progression maximale'][i]}</h2><img src="${name}-dark.svg" alt="${name}"></section>`).join('')}<section class="light"><h2>Sur un fond clair</h2><img src="active-transparent.svg" alt="Transparent sur fond clair"></section><p><a href="active-static.svg">Version statique</a> · <a href="active-transparent.svg">SVG transparent</a></p></html>`);
