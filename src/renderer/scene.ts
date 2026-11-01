import type { OrbitState, RenderOptions, Satellite } from '../types.js';
import { ASSETS } from './assets.generated.js';
import { createSatellites, orbitPath, position, TAU } from './orbit.js';
import { stars } from './stars.js';
import { escapeXml } from './svg.js';

const colors = { dark: { bg: '#090e1c', ink: '#7593b6' }, light: { bg: '#f5f6f8', ink: '#4d6383' }, transparent: { bg: '', ink: '#647e9f' } };

function motion(s: Satellite, activity: number): string {
  const frames = Array.from({ length: 65 }, (_, i) => {
    const { x, y } = position(s.orbitIndex, s.angle + TAU * i / 64);
    return `${(i * 100 / 64).toFixed(4)}%{transform:translate(${x}px,${y}px)}`;
  }).join('');
  const duration = (1 / s.speed / (1 + activity * .06)).toFixed(2);
  return `@keyframes orbit-${s.id}{${frames}}.flight-${s.id}{animation:orbit-${s.id} ${duration}s linear infinite}`;
}

function satellite(s: Satellite, state: OrbitState, animate: boolean): string {
  const p = position(s.orbitIndex, s.angle);
  const accents = ['#7bd8dc', '#e8bd73', '#a8ade8'];
  const led = state.activityLevel > 1 ? '#a8f2de' : accents[s.variant];
  return `<g class="flight-${s.id}" transform="translate(${p.x} ${p.y})"><g transform="translate(-17 -12)">
<use href="#satellite-tier-${s.tier}" width="34" height="24"/>
<rect x="18" y="11" width="1" height="1" fill="${led}"${animate ? ' class="led"' : ''}/>
${s.variant === 1 ? '<rect x="13" y="14" width="1" height="2" fill="#e8bd73"/>' : ''}
${animate && state.activityLevel >= 2 && s.id % 3 === 0 ? `<use href="#signal" x="18" y="0" width="6" height="6" color="${led}" class="radio" style="animation-delay:-${s.id}s"/>` : ''}
</g></g>`;
}

function communications(satellites: Satellite[], level: number, activity: number): string {
  if (satellites.length < 2 || !level) return '';
  return satellites.slice(0, level).map((a, index) => {
    const b = satellites[(index + 1) % satellites.length]!;
    // Matching trajectory samples ensure the signal follows both moving endpoints.
    const frames: string[] = [];
    for (let i = 0; i <= 40; i++) {
      const time = i / 40 * 12;
      const pa = position(a.orbitIndex, a.angle + time * a.speed * TAU * (1 + activity * .06));
      const pb = position(b.orbitIndex, b.angle + time * b.speed * TAU * (1 + activity * .06));
      const t = Math.max(0, Math.min(1, (i / 40 - .55) / .3));
      frames.push(`${i * 2.5}%{transform:translate(${Math.round(pa.x + (pb.x - pa.x) * t)}px,${Math.round(pa.y + (pb.y - pa.y) * t)}px);opacity:${i > 22 && i < 34 ? '.6' : '0'}}`);
    }
    // One short exchange on load: no permanent web of lines across the scene.
    return `<style>@keyframes relay-${index}{${frames.join('')}}</style><rect width="1" height="1" fill="#7bd8dc" opacity="0" style="animation:relay-${index} 12s linear"/>`;
  }).join('');
}

export function renderScene(username: string, state: OrbitState, options: RenderOptions = {}): string {
  if (!Number.isInteger(state.satelliteCount) || state.satelliteCount < 1 || state.satelliteCount > 24
    || !Number.isInteger(state.orbitCount) || state.orbitCount < 1 || state.orbitCount > 4
    || !Number.isInteger(state.orbitCapacity) || state.orbitCapacity < 1 || state.orbitCapacity > 6
    || state.satelliteCount > state.orbitCount * state.orbitCapacity
    || !Number.isInteger(state.satelliteTier) || state.satelliteTier < 1 || state.satelliteTier > 4
    || !Number.isInteger(state.starDensity) || state.starDensity < 0 || state.starDensity > 5) {
    throw new Error('Invalid constellation state.');
  }
  const theme = options.theme ?? 'transparent', animate = options.animation ?? true;
  if (!(theme in colors)) throw new Error('Theme must be transparent, dark or light.');
  const palette = colors[theme];
  const satellites = createSatellites(username, state);
  const vehicles = satellites.map(s => satellite(s, state, animate)).join('');
  const animation = animate ? `<style>
${satellites.map(s => motion(s, state.activityLevel)).join('')}
@keyframes twinkle{0%,100%{opacity:.25}50%{opacity:.7}}.twinkle{animation:twinkle 11s ease-in-out infinite}
@keyframes led{0%,85%,100%{opacity:.85}90%{opacity:.3}}.led{animation:led 7s linear infinite}
@keyframes radio{0%,78%,100%{opacity:0}85%{opacity:.5}}.radio{animation:radio 15s linear infinite}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}
</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 400 200" role="img" aria-labelledby="title desc" shape-rendering="crispEdges" style="image-rendering:pixelated;color:${palette.ink}">
<title id="title">${escapeXml(username)}'s Git Orbit</title><desc id="desc">A pixel-art Earth with ${state.satelliteCount} satellites across ${state.orbitCount} orbital layers, grown from GitHub activity.</desc>
<defs>${ASSETS}<clipPath id="front"><path d="M0 100h400v100H0z"/></clipPath></defs>
${animation}${palette.bg ? `<path fill="${palette.bg}" d="M0 0h400v200H0z"/>` : ''}
${stars(username, state.starDensity, animate)}
${Array.from({ length: state.orbitCount }, (_, i) => orbitPath(i)).join('')}
<g data-layer="back">${vehicles}</g>
${animate ? communications(satellites, state.communicationLevel, state.activityLevel) : ''}
<use href="#earth" x="164" y="64" width="72" height="72"/>
<g data-layer="front" clip-path="url(#front)">${vehicles}</g>
</svg>\n`;
}

export function renderError(message = 'No signal'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 400 200" role="img" aria-label="${escapeXml(message)}" shape-rendering="crispEdges"><defs>${ASSETS}</defs><use href="#earth" x="164" y="58" width="72" height="72"/><text x="200" y="151" text-anchor="middle" font-family="monospace" font-size="9" fill="#7185a0">${escapeXml(message)}</text></svg>\n`;
}
