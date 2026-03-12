export function trimArrayWithBorderRectangular(
  grid: number[][],
  borderWidth: number = 1
): number[][] {
  if (!grid || grid.length === 0 || grid[0]?.length === 0) {
    return grid;
  }

  const rows = grid.length;
  const cols = grid[0]?.length;

  let minRow = rows;
  let maxRow = -1;
  let minCol = cols;
  let maxCol = -1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  if (maxRow === -1) {
    return grid;
  }

  const topPadding = Math.max(0, borderWidth - minRow);
  const bottomPadding = Math.max(0, borderWidth - (rows - 1 - maxRow));
  const leftPadding = Math.max(0, borderWidth - minCol);
  const rightPadding = Math.max(0, borderWidth - (cols - 1 - maxCol));

  const newRows = rows + topPadding + bottomPadding;
  const newCols = cols + leftPadding + rightPadding;

  const borderMinRow = minRow - borderWidth + topPadding;
  const borderMaxRow = maxRow + borderWidth + topPadding;
  const borderMinCol = minCol - borderWidth + leftPadding;
  const borderMaxCol = maxCol + borderWidth + leftPadding;

  const result: number[][] = Array(newRows)
    .fill(null)
    .map(() => Array(newCols).fill(-1));

  for (let r = borderMinRow; r <= borderMaxRow; r++) {
    for (let c = borderMinCol; c <= borderMaxCol; c++) {
      const origR = r - topPadding;
      const origC = c - leftPadding;

      result[r][c] = grid[origR][origC] === 1 ? 1 : 0;
    }
  }

  return result;
}

export function trimArrayWithBorder(
  grid: number[][],
  snap = true,
  borderWidth: number = 3
): number[][] {
  if (!grid || grid.length === 0 || grid[0]?.length === 0) {
    return grid;
  }

  const rows = grid.length;
  const cols = grid[0]?.length;

  let minRow = rows;
  let maxRow = -1;
  let minCol = cols;
  let maxCol = -1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  if (maxRow === -1) {
    return grid;
  }

  const topPadding = Math.max(0, borderWidth - minRow);
  const bottomPadding = Math.max(0, borderWidth - (rows - 1 - maxRow));
  const leftPadding = Math.max(0, borderWidth - minCol);
  const rightPadding = Math.max(0, borderWidth - (cols - 1 - maxCol));

  const newRows = rows + topPadding + bottomPadding;
  const newCols = cols + leftPadding + rightPadding;

  const result: number[][] = Array(newRows)
    .fill(null)
    .map(() => Array(newCols).fill(-1));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        result[r + topPadding][c + leftPadding] = 1;
      }
    }
  }

  const visited = new Set<string>();
  let currentLayer: [number, number][] = [];

  for (let r = 0; r < newRows; r++) {
    for (let c = 0; c < newCols; c++) {
      if (result[r][c] === 1) {
        currentLayer.push([r, c]);
        visited.add(`${r},${c}`);
      }
    }
  }

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let layer = 0; layer < borderWidth; layer++) {
    const nextLayer: [number, number][] = [];

    for (const [r, c] of currentLayer) {
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        const key = `${nr},${nc}`;

        if (
          nr >= 0 &&
          nr < newRows &&
          nc >= 0 &&
          nc < newCols &&
          !visited.has(key) &&
          result[nr][nc] === -1
        ) {
          visited.add(key);
          result[nr][nc] = 0;
          nextLayer.push([nr, nc]);
        }
      }
    }

    currentLayer = nextLayer;
  }

  const exterior = new Set<string>();
  const queue: [number, number][] = [];

  for (let r = 0; r < newRows; r++) {
    if (result[r][0] === -1) queue.push([r, 0]);
    if (result[r][newCols - 1] === -1) queue.push([r, newCols - 1]);
  }
  for (let c = 0; c < newCols; c++) {
    if (result[0][c] === -1) queue.push([0, c]);
    if (result[newRows - 1][c] === -1) queue.push([newRows - 1, c]);
  }

  for (const [r, c] of queue) {
    exterior.add(`${r},${c}`);
  }

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (
        nr >= 0 &&
        nr < newRows &&
        nc >= 0 &&
        nc < newCols &&
        !exterior.has(key) &&
        result[nr][nc] === -1
      ) {
        exterior.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  for (let r = 0; r < newRows; r++) {
    for (let c = 0; c < newCols; c++) {
      if (result[r][c] === -1 && !exterior.has(`${r},${c}`)) {
        result[r][c] = 0;
      }
    }
  }

  if (!snap) {
    for (let r = 0; r < newRows; r++) {
      for (let c = 0; c < newCols; c++) {
        if (result[r][c] === -1 && exterior.has(`${r},${c}`)) {
          result[r][c] = 1;
        }
      }
    }
  }

  return result;
}

export function addBorderPath(grid: number[][], spacing: number, cellSize: number, padding = 0.1) {
  const edges = collectEdges(grid);
  return edgesToPath(edges, cellSize, spacing, padding);
}

function isInside(value: number) {
  return value >= 0;
}

type Edge = { points: number[][]; normal: number[] };

function collectEdges(grid: number[][]): Edge[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const edges = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!isInside(grid[y][x])) continue;

      if (y === 0 || !isInside(grid[y - 1][x])) {
        edges.push({
          points: [
            [x, y],
            [x + 1, y],
          ],
          normal: [0, -1],
        });
      }
      if (y === rows - 1 || !isInside(grid[y + 1][x])) {
        edges.push({
          points: [
            [x, y + 1],
            [x + 1, y + 1],
          ],
          normal: [0, 1],
        });
      }
      if (x === 0 || !isInside(grid[y][x - 1])) {
        edges.push({
          points: [
            [x, y],
            [x, y + 1],
          ],
          normal: [-1, 0],
        });
      }
      if (x === cols - 1 || !isInside(grid[y][x + 1])) {
        edges.push({
          points: [
            [x + 1, y],
            [x + 1, y + 1],
          ],
          normal: [1, 0],
        });
      }
    }
  }

  return edges;
}

function edgesToPath(edges: Edge[], cellSize: number, _spacing: number, padding = 0.1) {
  if (!edges.length) return "";

  const orderedEdges: Edge[] = [];
  const firstEdge = edges.shift();
  if (!firstEdge) return "";
  orderedEdges.push(firstEdge);

  let currentEnd = firstEdge.points[1];

  while (edges.length > 0) {
    const idx = edges.findIndex(
      (e: Edge) =>
        (e.points[0][0] === currentEnd[0] &&
          e.points[0][1] === currentEnd[1]) ||
        (e.points[1][0] === currentEnd[0] && e.points[1][1] === currentEnd[1])
    );

    if (idx === -1) break;

    const edge = edges.splice(idx, 1)[0];

    if (
      edge.points[1][0] === currentEnd[0] &&
      edge.points[1][1] === currentEnd[1]
    ) {
      edge.points = [edge.points[1], edge.points[0]];
    }

    orderedEdges.push(edge);
    currentEnd = edge.points[1];
  }

  const path = [];
  const numEdges = orderedEdges.length;

  for (let i = 0; i < numEdges; i++) {
    const prevEdge = orderedEdges[(i - 1 + numEdges) % numEdges]!;
    const currEdge = orderedEdges[i]!;

    const cornerPoint = currEdge.points[0];
    const prevNormal = prevEdge.normal;
    const currNormal = currEdge.normal;

    const offsetCorner = calculateCornerPoint(
      cornerPoint,
      prevNormal,
      currNormal,
      padding
    );

    if (i === 0) {
      path.push(`M${offsetCorner[0] * cellSize},${offsetCorner[1] * cellSize}`);
    } else {
      path.push(`L${offsetCorner[0] * cellSize},${offsetCorner[1] * cellSize}`);
    }
  }

  path.push("Z");
  return path.join(" ");
}

function calculateCornerPoint(point: number[], normal1: number[], normal2: number[], padding: number) {
  if (padding === 0) return point;

  const [x, y] = point;
  const [nx1, ny1] = normal1;
  const [nx2, ny2] = normal2;

  const bisectorX = nx1 + nx2;
  const bisectorY = ny1 + ny2;

  const bisectorLen = Math.sqrt(bisectorX * bisectorX + bisectorY * bisectorY);

  if (bisectorLen < 0.01) {
    return [x + nx1 * padding, y + ny1 * padding];
  }

  const normBisectorX = bisectorX / bisectorLen;
  const normBisectorY = bisectorY / bisectorLen;

  const cosAngle = nx1 * normBisectorX + ny1 * normBisectorY;

  if (Math.abs(cosAngle) < 0.01) {
    return [x + nx1 * padding, y + ny1 * padding];
  }

  const miterLength = padding / cosAngle;

  return [x + normBisectorX * miterLength, y + normBisectorY * miterLength];
}

export function trimArrayWithBorderCircular(
  grid: number[][],
  borderWidth: number = 1
): number[][] {
  if (!grid || grid.length === 0 || grid[0]?.length === 0) {
    return grid;
  }

  const rows = grid.length;
  const cols = grid[0]?.length;

  let sumR = 0;
  let sumC = 0;
  let count = 0;
  let maxDist = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        sumR += r;
        sumC += c;
        count++;
      }
    }
  }

  if (count === 0) {
    return grid;
  }

  const centerR = sumR / count;
  const centerC = sumC / count;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        const dist = Math.sqrt((r - centerR) ** 2 + (c - centerC) ** 2);
        maxDist = Math.max(maxDist, dist);
      }
    }
  }

  const radius = maxDist + borderWidth;

  // The output grid should be a square with side length = diameter of the circle
  const diameter = Math.ceil(radius * 2);

  const newRows = diameter;
  const newCols = diameter;

  // Place the center of mass at the center of the new grid
  const newCenterR = diameter / 2;
  const newCenterC = diameter / 2;

  // Calculate offset to map from new grid to original grid
  const offsetR = centerR - newCenterR;
  const offsetC = centerC - newCenterC;

  const result: number[][] = Array(newRows)
    .fill(null)
    .map(() => Array(newCols).fill(-1));

  for (let r = 0; r < newRows; r++) {
    for (let c = 0; c < newCols; c++) {
      const dist = Math.sqrt((r - newCenterR) ** 2 + (c - newCenterC) ** 2);

      if (dist <= radius) {
        const origR = Math.round(r + offsetR);
        const origC = Math.round(c + offsetC);

        if (origR >= 0 && origR < rows && origC >= 0 && origC < cols) {
          result[r][c] = grid[origR][origC] === 1 ? 1 : 0;
        } else {
          result[r][c] = 0;
        }
      }
    }
  }

  return result;
}

export function destroyEdges(grid: number[][]) {
  return grid.map((row: number[], _j: number) => {
    const l = Math.floor((Math.random() * row.length) / 2);
    const r = row.length - Math.floor((Math.random() * row.length) / 2);

    return row.map((cell: number, i: number) => {
      if (i < l || i > r) {
        return -1;
      }
      // if (cell == 0) {
      //   return 1
      // }
      return cell == -1 ? 1 : 0;
    });
  });
}

export function shift(grid: number[][]) {
  return grid.map((row: number[]) => {
    const x = Math.floor(Math.random() * 3);

    // Shift left: move first x elements to the end
    return [...row.slice(x), ...row.slice(0, x)];

    // Or shift right: move last x elements to the beginning
    // return [...row.slice(-x), ...row.slice(0, -x)];
  });
}

export function addSimpleBorder(grid: number[][]) {
  if (!grid || grid.length === 0) return grid;

  const height = grid.length;
  const width = grid[0].length;

  const borderedGrid = [];

  borderedGrid.push(new Array(width + 2).fill(1));

  for (let y = 0; y < height; y++) {
    borderedGrid.push([1, ...grid[y], 1]);
  }

  borderedGrid.push(new Array(width + 2).fill(1));

  return borderedGrid;
}
