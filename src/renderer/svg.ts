export const escapeXml = (value: string): string => value.replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

/** Run-length rectangles grouped into one path per palette entry. */
export function pixelsToPaths(rows: (string | null)[][]): string {
  const paths = new Map<string, string[]>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const color = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === color) end++;
      if (color) {
        const runs = paths.get(color) ?? [];
        runs.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
        paths.set(color, runs);
      }
      x = end;
    }
  });
  return [...paths].map(([fill, path]) => `<path fill="${fill}" d="${path.join('')}"/>`).join('');
}
