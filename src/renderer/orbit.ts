import type { OrbitState, Satellite } from '../types.js';
import { makeRng } from '../utils/seed.js';

export const ORBITS = [
  { rx: 76, ry: 28, tilt: -28, direction: 1 },
  { rx: 111, ry: 33, tilt: 31, direction: -1 },
  { rx: 91, ry: 30, tilt: -61, direction: 1 },
  { rx: 176, ry: 57, tilt: 5, direction: -1 },
];
export const TAU = 2 * Math.PI;

export function position(orbitIndex: number, angle: number): { x: number; y: number; depth: number } {
  const { rx, ry, tilt } = ORBITS[orbitIndex]!;
  const rotation = tilt * Math.PI / 180;
  const u = Math.cos(angle) * rx, v = Math.sin(angle) * ry;
  return {
    x: Math.round(200 + u * Math.cos(rotation) - v * Math.sin(rotation)),
    y: Math.round(100 + u * Math.sin(rotation) + v * Math.cos(rotation)),
    depth: Math.sin(angle) * Math.sqrt(rx * rx - ry * ry),
  };
}

/** The near half of each orbital plane, not the lower half of the entire image. */
export function frontClipPath(index: number): string {
  const rotation = ORBITS[index]!.tilt * Math.PI / 180;
  const ux = Math.cos(rotation) * 600, uy = Math.sin(rotation) * 600;
  const vx = -Math.sin(rotation) * 600, vy = Math.cos(rotation) * 600;
  const points = [[200 - ux, 100 - uy], [200 + ux, 100 + uy],
    [200 + ux + vx, 100 + uy + vy], [200 - ux + vx, 100 - uy + vy]];
  return `<clipPath id="front-${index}"><path d="${points.map((p, i) => `${i ? 'L' : 'M'}${p[0]!.toFixed(3)} ${p[1]!.toFixed(3)}`).join('')}z"/></clipPath>`;
}

export function createSatellites(username: string, state: OrbitState): Satellite[] {
  const capacity = state.orbitCapacity;
  return Array.from({ length: state.satelliteCount }, (_, id) => {
    const orbitIndex = Math.min(state.orbitCount - 1, Math.floor(id / capacity));
    const rng = makeRng(`${username}:orbit:${orbitIndex}`);
    const occupants = Math.min(capacity, state.satelliteCount - orbitIndex * capacity);
    // A lone satellite starts in front of Earth, so even the static seed is visible.
    const phase = rng() * (occupants === 1 ? Math.PI : TAU);
    const ownRng = makeRng(`${username}:satellite:${id}`);
    return {
      id, orbitIndex, angle: phase + (id % capacity) * TAU / occupants,
      speed: 1 / (80 + orbitIndex * 28),
      tier: Math.max(1, state.satelliteTier - (id % 5 === 4 ? 1 : 0)),
      variant: Math.floor(ownRng() * 3),
    };
  });
}

export function orbitPath(index: number): string {
  const points = new Set<string>();
  for (let i = 0; i < 360; i += 2) {
    const { x, y } = position(index, i * Math.PI / 180);
    points.add(`M${x} ${y}h1v1h-1z`);
  }
  return `<path d="${[...points].join('')}" fill="currentColor" opacity=".2"/>`;
}
