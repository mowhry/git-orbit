import { EARTH_ROTATION } from './assets.generated.js';

export function earthMotion(): string {
  const { frameCount, frameSize, duration } = EARTH_ROTATION;
  return `@keyframes earth-turn{to{transform:translateX(-${frameCount * frameSize}px)}}.earth-turn{animation:earth-turn ${duration}s steps(${frameCount},end) infinite}`;
}

export function earth(animate: boolean): string {
  const still = '<use href="#earth" x="164" y="64" width="72" height="72"/>';
  if (!animate) return still;
  const { frameCount, frameSize, dataUri } = EARTH_ROTATION;
  // The nested viewport clips exactly one whole pixel frame. A disabled animation
  // naturally shows frame zero; the static symbol also covers unsupported image loads.
  return `${still}<svg x="164" y="64" width="72" height="72" viewBox="0 0 72 72" overflow="hidden" aria-hidden="true"><image class="earth-turn" width="${frameCount * frameSize}" height="${frameSize}" href="${dataUri}"/></svg>`;
}
