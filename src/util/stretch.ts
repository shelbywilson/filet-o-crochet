/**
 * Makes a glyph taller by inserting a row after each row index in `gaps`. The new row
 * only bridges strokes that connect the two rows, so verticals get longer,
 * diagonals stay connected, and horizontal bars stay 1 cell thick.
 */
export function stretchGlyph(grid: number[][], gaps: Set<number>): number[][] {
  const out: number[][] = [];
  grid.forEach((above, r) => {
    out.push(above);
    const below = grid[r + 1];
    if (!below || !gaps.has(r)) return;
    const on = (row: number[], c: number) => row[c] === 1;
    const bridge = above.map(() => 0);

    // vertical continuations
    above.forEach((_, c) => {
      if (on(above, c) && on(below, c)) bridge[c] = 1;
    });

    // diagonal steps
    above.forEach((_, c) => {
      if (!on(above, c)) return;
      for (const d of [c - 1, c + 1]) {
        if (!on(below, d)) continue;
        // already joined through a horizontal neighbour + vertical
        if (on(above, d) || on(below, c)) continue;
        // a peak (two legs going down) is bridged on its legs, giving an arch instead of a spike
        const isPeak = on(below, c - 1) && on(below, c + 1);
        bridge[isPeak ? d : c] = 1;
      }
    });

    out.push(bridge);
  });
  return out;
}

const inkRows = (grid: number[][]) =>
  grid.flatMap((row, r) => (row.includes(1) ? [r] : []));

/** Gaps in the middle of rows top..bottom, leaving the outer `margin` (min 1 row) at each end unstretched. */
function middleGaps(top: number, bottom: number, margin: number): number[] {
  const edge = Math.max(1, Math.round((bottom - top + 1) * margin));
  const gaps: number[] = [];
  for (let r = top + edge; r < bottom - edge; r++) gaps.push(r);
  return gaps;
}

/**
 * Stretches the middle of every letter, leaving the top and bottom `margin` of each
 * letter as-is. The body (above the baseline) and any descender are stretched
 * separately so x-heights stay consistent, then glyphs are re-padded so baselines align.
 */
export function stretchAlphabet<T extends Record<string, number[][]>>(
  alpha: T,
  margin = 0.15,
): T {
  // baseline = the most common bottom ink row
  const bottoms = Object.values(alpha).map((g) => inkRows(g).at(-1)).filter((r) => r !== undefined);
  const counts = new Map<number, number>();
  bottoms.forEach((r) => counts.set(r!, (counts.get(r!) ?? 0) + 1));
  const baseline = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

  const stretched = Object.entries(alpha).map(([k, grid]) => {
    const ink = inkRows(grid);
    const gaps = new Set<number>();
    if (ink.length) {
      const top = ink[0];
      const bottom = ink[ink.length - 1];
      middleGaps(top, Math.min(bottom, baseline), margin).forEach((r) => gaps.add(r));
      if (bottom > baseline) middleGaps(baseline, bottom, margin).forEach((r) => gaps.add(r));
    }
    const newBaseline = baseline + [...gaps].filter((r) => r < baseline).length;
    return { k, grid: stretchGlyph(grid, gaps), newBaseline };
  });

  const maxBaseline = Math.max(...stretched.map((s) => s.newBaseline));
  const padded = stretched.map(({ k, grid, newBaseline }) => {
    const blank = () => Array(grid[0]?.length ?? 0).fill(0);
    const top = Array.from({ length: maxBaseline - newBaseline }, blank);
    return { k, grid: [...top, ...grid] };
  });
  const height = Math.max(...padded.map((p) => p.grid.length));
  return Object.fromEntries(
    padded.map(({ k, grid }) => [
      k,
      [...grid, ...Array.from({ length: height - grid.length }, () => Array(grid[0]?.length ?? 0).fill(0))],
    ]),
  ) as T;
}
