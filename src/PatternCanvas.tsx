import { useRef, useEffect } from "react";
import { addBorderPath } from "./util/border";

interface IPatternCanvas {
  grid: number[][];
  cellSize: number;
  spacing: number;
  padding: number;
  preview: boolean;
  shape: "circle" | "square" | "cross" | "star";
  invert: boolean;
  toggleCell: (i: number, j: number, val: 0 | 1 | -1) => void;
  setSelected: (pos: { row: number; col: number }) => void;
  selected: { row: number; col: number } | null;
  symmetry: {
    x?: boolean;
    y?: boolean;
    z?: boolean;
    rotate90?: boolean;
    rotate180?: boolean;
  } | null;
}

export default function PatternCanvas({
  grid,
  cellSize,
  spacing,
  padding,
  preview,
  shape,
  invert,
  toggleCell,
  setSelected,
  selected,
  symmetry,
}: IPatternCanvas) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const canvasW = 2 * cellSize + cellSize * spacing + cols * cellSize;
  const canvasH = 2 * cellSize + cellSize * spacing + rows * cellSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgb(40, 40, 40)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cellSize, cellSize);

    // Border path
    const borderPathStr = addBorderPath(grid, spacing, cellSize, padding);
    if (borderPathStr) {
      const borderPath = new Path2D(borderPathStr);
      if (preview) {
        ctx.fillStyle = "#fff";
        ctx.fill(borderPath);
      } else {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        ctx.stroke(borderPath);
      }
    }

    // Draw cells
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      for (let colIndex = 0; colIndex < cols; colIndex++) {
        let cell = grid[rowIndex][colIndex];
        if (cell === -1) continue;

        if (invert) {
          if (cell === 0) cell = 1;
          else if (cell === 1) cell = 0;
        }

        const x = colIndex * cellSize;
        const y = rowIndex * cellSize;

        if (preview) {
          if (shape === "star") {
            const sp = new Path2D(starPathStr(x + cellSize / 2, y + cellSize / 2, (cellSize * (1 - spacing)) / 2, (cellSize * (1 - spacing)) / 2 * 0.389));
            ctx.fillStyle = cell === 1 ? "#fff" : "rgb(40, 40, 40)";
            ctx.fill(sp);
          } else if (shape === "circle") {
            ctx.beginPath();
            ctx.arc(
              x + cellSize / 2,
              y + cellSize / 2,
              (cellSize * (1 - spacing)) / 2,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = cell === 1 ? "#fff" : "rgb(40, 40, 40)";
            ctx.fill();
          } else if (shape === "cross") {
            if (cell !== 1) drawCross(ctx, x, y, cellSize, spacing, preview);
          } else {
            if (cell === 1) {
              ctx.fillStyle = "#fff";
              ctx.fillRect(x, y, cellSize, cellSize);
            } else {
              const off = (spacing * cellSize) / 2;
              const size = cellSize - spacing * cellSize;
              ctx.fillStyle = "rgb(40, 40, 40)";
              ctx.fillRect(x + off, y + off, size, size);
            }
          }
        } else {
          // cut-lines mode
          if (shape === "cross") {
            if (cell !== 1) drawCross(ctx, x, y, cellSize, spacing, preview);
          } else if (shape === "star") {
            if (cell === 0) {
              const sp = new Path2D(starPathStr(x + cellSize / 2, y + cellSize / 2, (cellSize * (1 - spacing)) / 2, (cellSize * (1 - spacing)) / 2 * 0.389));
              ctx.strokeStyle = "red";
              ctx.lineWidth = 1;
              ctx.stroke(sp);
            }
          } else if (cell === 0) {
            if (shape === "circle") {
              ctx.beginPath();
              ctx.arc(
                x + cellSize / 2,
                y + cellSize / 2,
                (cellSize * (1 - spacing)) / 2,
                0,
                Math.PI * 2,
              );
              ctx.strokeStyle = "red";
              ctx.lineWidth = 1;
              ctx.stroke();
            } else {
              const off = (spacing * cellSize) / 2;
              const size = cellSize - spacing * cellSize;
              ctx.strokeStyle = "red";
              ctx.lineWidth = 1;
              ctx.strokeRect(x + off, y + off, size, size);
            }
          }
        }
      }
    }

    // Selected cell highlights
    if (selected) {
      const drawHighlight = (col: number, row: number) => {
        if (row < 0 || row >= rows || col < 0 || col >= cols) return;
        ctx.strokeStyle = preview ? "red" : "aliceblue";
        ctx.lineWidth = 2;
        ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
      };

      drawHighlight(selected.col, selected.row);

      if (symmetry && selected.row !== null && selected.col !== null) {
        if (symmetry.x) drawHighlight(selected.col, rows - selected.row - 1);
        if (symmetry.y) drawHighlight(cols - selected.col - 1, selected.row);
        if ((symmetry.x && symmetry.y) || symmetry.z) {
          drawHighlight(cols - selected.col - 1, rows - selected.row - 1);
        }
        if (symmetry.rotate90 && rows === cols) {
          drawHighlight(selected.row, rows - selected.col - 1);
          drawHighlight(cols - selected.col - 1, rows - selected.row - 1);
          drawHighlight(rows - selected.row - 1, selected.col);
        }
        if (symmetry.rotate180) {
          drawHighlight(cols - selected.col - 1, rows - selected.row - 1);
        }
      }
    }

    ctx.restore();
  }, [grid, selected, cellSize, spacing, padding, preview, shape, invert, symmetry, rows, cols]);

  const getCellCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX - cellSize;
    const y = (e.clientY - rect.top) * scaleY - cellSize;
    return {
      col: Math.floor(x / cellSize),
      row: Math.floor(y / cellSize),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { row, col } = getCellCoords(e);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    let cell = grid[row][col];
    if (invert) {
      if (cell === 0) cell = 1;
      else if (cell === 1) cell = 0;
    }
    toggleCell(row, col, e.button === 2 ? -1 : cell === 0 ? 1 : 0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { row, col } = getCellCoords(e);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    setSelected({ row, col });
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      style={{
        display: "block",
        margin: "0 auto",
        width: "100%",
        maxWidth: canvasW,
        cursor: "crosshair",
        imageRendering: "pixelated",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function starPathStr(cx: number, cy: number, outerR: number, innerR: number): string {
  const parts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    parts.push(`${i === 0 ? "M" : "L"} ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`);
  }
  return parts.join(" ") + " Z";
}

function drawCross(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  spacing: number,
  preview: boolean,
) {
  const s = spacing / 2.5;
  const e = 1 - spacing / 2.5;
  const m = 0.5;
  const w = spacing / 8;
  const pathStr = [
    `M ${s + w} ${s}`,
    `L ${m} ${m - w}`,
    `L ${e - w} ${s}`,
    `L ${e} ${s + w}`,
    `L ${m + w} ${m}`,
    `L ${e} ${e - w}`,
    `L ${e - w} ${e}`,
    `L ${m} ${m + w}`,
    `L ${s + w} ${e}`,
    `L ${s} ${e - w}`,
    `L ${m - w} ${m}`,
    `L ${s} ${s + w}`,
    "Z",
  ].join(" ");

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(cellSize, cellSize);
  const path = new Path2D(pathStr);
  ctx.fillStyle = "rgb(40, 40, 40)";
  ctx.fill(path);
  if (!preview) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 0.05;
    ctx.stroke(path);
  }
  ctx.restore();
}
