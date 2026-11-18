/** Curvas amostradas do logo e das linhas (px de rolagem → valor). */
export type Sample = readonly [scroll: number, value: number];

/** Ramer–Douglas–Peucker: menos keyframes, desvio máximo `tolerance`. */
export function simplify(points: readonly Sample[], tolerance: number): Sample[] {
  if (points.length < 3) return [...points];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    const [x0, y0] = points[first];
    const [x1, y1] = points[last];
    let worst = -1;
    let worstError = tolerance;
    for (let index = first + 1; index < last; index += 1) {
      const [x, y] = points[index];
      const expected = y0 + ((y1 - y0) * (x - x0)) / Math.max(1e-9, x1 - x0);
      const error = Math.abs(y - expected);
      if (error > worstError) {
        worstError = error;
        worst = index;
      }
    }
    if (worst > 0) {
      keep[worst] = 1;
      stack.push([first, worst], [worst, last]);
    }
  }
  return points.filter((_, index) => keep[index] === 1);
}

/** Une duas séries simplificadas nos mesmos pontos de rolagem. */
export function mergeScrolls(...series: Sample[][]): number[] {
  return [...new Set(series.flatMap((points) => points.map(([scroll]) => scroll)))]
    .sort((a, b) => a - b);
}

export function valueAt(points: readonly Sample[], scroll: number): number {
  let index = 1;
  while (index < points.length - 1 && points[index][0] < scroll) index += 1;
  const [x0, y0] = points[index - 1];
  const [x1, y1] = points[index];
  if (x1 === x0) return y1;
  return y0 + ((y1 - y0) * (scroll - x0)) / (x1 - x0);
}
