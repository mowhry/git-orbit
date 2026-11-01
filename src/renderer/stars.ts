import { makeRng } from '../utils/seed.js';

export function stars(username: string, density: number, animation: boolean): string {
  const rng = makeRng(`${username}:stars`);
  const count = [10, 20, 32, 45, 62, 80][density]!;
  return Array.from({ length: count }, (_, i) => {
    let x: number, y: number;
    do { x = 13 + Math.floor(rng() * 374); y = 12 + Math.floor(rng() * 176); }
    while (((x - 200) / 50) ** 2 + ((y - 100) / 43) ** 2 < 1);
    const bright = i > 10 && i % 13 === 0;
    const opacity = (0.25 + rng() * 0.4).toFixed(2);
    const effect = animation && i % 9 === 0 ? ` class="twinkle" style="animation-delay:-${i % 11}s"` : '';
    return `<g opacity="${opacity}"${effect}>${bright
      ? `<use href="#star" x="${x - 2}" y="${y - 2}" width="5" height="5"/>`
      : `<rect x="${x}" y="${y}" width="1" height="1" fill="currentColor"/>`}</g>`;
  }).join('');
}
