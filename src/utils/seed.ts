/** FNV-1a + Mulberry32. Separate named streams keep stars independent of satellites. */
export function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export function makeRng(seed: string): () => number {
  let state = hash(seed.toLowerCase());
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
