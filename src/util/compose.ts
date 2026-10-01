import { Part } from "../types";

export function composeParts(parts: Part[], rows: number, cols: number): number[][] {
  const canvas = Array(rows).fill(null).map(() => Array(cols).fill(0));
  for (const part of parts) {
    for (let r = 0; r < part.grid.length; r++) {
      for (let c = 0; c < part.grid[r].length; c++) {
        const cell = part.grid[r][c];
        if (cell !== 1) continue; // only 1 (filled) cells paint onto the canvas
        const tr = r + part.offsetRow;
        const tc = c + part.offsetCol;
        if (tr >= 0 && tr < rows && tc >= 0 && tc < cols) {
          canvas[tr][tc] = cell;
        }
      }
    }
  }
  return canvas;
}

/**
 * Like composeParts but starts with -1 (outside) and paints 0/1 from parts.
 * Parts' -1 cells are transparent (don't overwrite). Used for the border path.
 */
export function composeShape(parts: Part[], rows: number, cols: number): number[][] {
  const canvas = Array(rows).fill(null).map(() => Array(cols).fill(-1));
  for (const part of parts) {
    for (let r = 0; r < part.grid.length; r++) {
      for (let c = 0; c < part.grid[r].length; c++) {
        const cell = part.grid[r][c];
        if (cell === -1) continue; // transparent
        const tr = r + part.offsetRow;
        const tc = c + part.offsetCol;
        if (tr >= 0 && tr < rows && tc >= 0 && tc < cols) {
          canvas[tr][tc] = cell;
        }
      }
    }
  }
  return canvas;
}

/** Returns the bounding box of a part on the canvas (clamped to canvas bounds). */
export function partBounds(part: Part, canvasRows: number, canvasCols: number) {
  const rowStart = Math.max(0, part.offsetRow);
  const colStart = Math.max(0, part.offsetCol);
  const rowEnd = Math.min(canvasRows, part.offsetRow + part.grid.length);
  const colEnd = Math.min(canvasCols, part.offsetCol + (part.grid[0]?.length ?? 0));
  return { rowStart, colStart, rowEnd, colEnd };
}
