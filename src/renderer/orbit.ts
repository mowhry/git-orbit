import type { OrbitState, Satellite } from '../types.js';
import { makeRng } from '../utils/seed.js';

export const ORBITS = [
  { rx: 66, ry: 27 }, { rx: 103, ry: 43 }, { rx: 140, ry: 59 }, { rx: 176, ry: 76 },
];
export const TAU = 2 * Math.PI;

export function position(orbitIndex: number, angle: number): { x: number; y: number } {
  const { rx, ry } = ORBITS[orbitIndex]!;
  return { x: Math.round(200 + Math.cos(angle) * rx), y: Math.round(100 + Math.sin(angle) * ry) };
}

export function createSatellites(username: string, state: OrbitState): Satellite[] {
  const capacity = state.orbitCapacity;
  return Array.from({ length: state.satelliteCount }, (_, id) => {
    const orbitIndex = Math.min(state.orbitCount - 1, Math.floor(id / capacity));
    const rng = makeRng(`${username}:orbit:${orbitIndex}`);
    const phase = rng() * TAU;
    const occupants = Math.min(capacity, state.satelliteCount - orbitIndex * capacity);
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
