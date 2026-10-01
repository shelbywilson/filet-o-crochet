import { useRef, useEffect, useCallback } from "react";
import { addBorderPath } from "./util/border";
import { composeParts, composeShape } from "./util/compose";
import { Part } from "./types";

interface IPatternCanvas {
  grid: number[][];
  shapeGrid: number[][];
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
    rotate90?: boolean;
    rotate180?: boolean;
  } | null;
  showNumbers: boolean;
  onStrokeStart: () => void;
  activePart?: Part;
  mode: "draw" | "move";
  parts: Part[];
  setActivePartId: (id: string) => void;
  movePart: (id: string, offsetRow: number, offsetCol: number) => void;
}

export default function PatternCanvas({
  grid,
  shapeGrid,
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
  showNumbers,
  onStrokeStart,
  activePart,
  mode,
  parts,
  setActivePartId,
  movePart,
}: IPatternCanvas) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const drawValue = useRef<0 | 1 | -1>(1);
  const isDragging = useRef(false);
  const dragPartId = useRef<string | null>(null);
  const dragStartCell = useRef<{ row: number; col: number } | null>(null);
  const dragPartInitialOffset = useRef<{ offsetRow: number; offsetCol: number } | null>(null);
  const dragCurrentOffset = useRef<{ offsetRow: number; offsetCol: number } | null>(null);

  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const canvasW = 2 * cellSize + cellSize * spacing + cols * cellSize;
  const canvasH = 2 * cellSize + cellSize * spacing + rows * cellSize;

  // All current props in a ref so drawCanvas can read them without being recreated
  const propsRef = useRef({
    grid, shapeGrid, cellSize, spacing, padding, preview, shape, invert,
    selected, symmetry, showNumbers, activePart, mode, parts, rows, cols,
  });
  propsRef.current = {
    grid, shapeGrid, cellSize, spacing, padding, preview, shape, invert,
    selected, symmetry, showNumbers, activePart, mode, parts, rows, cols,
  };

  const drawCanvas = useCallback((dragOverride?: { id: string; offsetRow: number; offsetCol: number } | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const {
      grid: composedGrid, shapeGrid: composedShape, cellSize, spacing, padding, preview, shape, invert,
      selected, symmetry, showNumbers, activePart, mode, rows, cols,
    } = propsRef.current;

    let effectiveGrid = composedGrid;
    let effectiveShape = composedShape;
    let effectiveParts = propsRef.current.parts;

    if (dragOverride) {
      effectiveParts = propsRef.current.parts.map((p) =>
        p.id === dragOverride.id
          ? { ...p, offsetRow: dragOverride.offsetRow, offsetCol: dragOverride.offsetCol }
          : p,
      );
      effectiveGrid = composeParts(effectiveParts, rows, cols);
      effectiveShape = composeShape(effectiveParts, rows, cols);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgb(40, 40, 40)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cellSize, cellSize);

    // Border path
    const borderPathStr = addBorderPath(effectiveShape, spacing, cellSize, padding);
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
        if (effectiveShape[rowIndex]?.[colIndex] === -1) continue;
        let cell = effectiveGrid[rowIndex][colIndex];
        if (cell === -1) continue;

        if (invert) {
          if (cell === 0) cell = 1;
          else if (cell === 1) cell = 0;
        }

        const x = colIndex * cellSize;
        const y = rowIndex * cellSize;

        if (preview) {
          if (shape === "star") {
            const sp = new Path2D(
              starPathStr(
                x + cellSize / 2,
                y + cellSize / 2,
                (cellSize * (1 - spacing)) / 2,
                ((cellSize * (1 - spacing)) / 2) * 0.389,
              ),
            );
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
              const sp = new Path2D(
                starPathStr(
                  x + cellSize / 2,
                  y + cellSize / 2,
                  (cellSize * (1 - spacing)) / 2,
                  ((cellSize * (1 - spacing)) / 2) * 0.389,
                ),
              );
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

    // Guide lines every 8 rows/cols
    if (showNumbers) {
      ctx.strokeStyle = "rgb(27, 27, 27)";
      ctx.lineWidth = 1;
      for (let c = 8; c < cols; c += 8) {
        ctx.beginPath();
        ctx.moveTo(c * cellSize, 0);
        ctx.lineTo(c * cellSize, rows * cellSize);
        ctx.stroke();
      }
      for (let r = 8; r < rows; r += 8) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellSize);
        ctx.lineTo(cols * cellSize, r * cellSize);
        ctx.stroke();
      }

      // Row/column numbers
      const fontSize = Math.max(8, Math.min(cellSize * 0.6, 14));
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(255, 200, 100, 1)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let c = 0; c < cols; c++) {
        ctx.fillText(String(cols - c), c * cellSize + cellSize / 2, -cellSize / 2);
      }
      ctx.textAlign = "right";
      for (let r = 0; r < rows; r++) {
        ctx.fillText(String(rows - r), -cellSize * 0.15 - 4, r * cellSize + cellSize / 2);
      }
    }

    // Part outlines (all parts in move mode, active part always)
    if (mode === "move") {
      for (const part of effectiveParts) {
        const isActive = part.id === activePart?.id;
        const pRows = part.grid.length;
        const pCols = part.grid[0]?.length ?? 0;
        ctx.strokeStyle = isActive ? "rgba(255, 165, 0, 0.9)" : "rgba(255, 165, 0, 0.3)";
        ctx.lineWidth = isActive ? 1.5 : 1;
        ctx.setLineDash(isActive ? [4, 3] : [2, 4]);
        ctx.strokeRect(
          part.offsetCol * cellSize,
          part.offsetRow * cellSize,
          pCols * cellSize,
          pRows * cellSize,
        );
        if (isActive) {
          ctx.fillStyle = "rgba(255, 165, 0, 0.15)";
          ctx.fillRect(
            part.offsetCol * cellSize,
            part.offsetRow * cellSize,
            pCols * cellSize,
            pRows * cellSize,
          );
        }
      }
      ctx.setLineDash([]);
    } else if (activePart) {
      const pRows = activePart.grid.length;
      const pCols = activePart.grid[0]?.length ?? 0;
      ctx.strokeStyle = "rgba(255, 165, 0, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(
        activePart.offsetCol * cellSize,
        activePart.offsetRow * cellSize,
        pCols * cellSize,
        pRows * cellSize,
      );
      ctx.setLineDash([]);
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
        if (symmetry.x && symmetry.y) {
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
  }, []); // stable — reads all state from propsRef

  useEffect(() => {
    // If dragging, preserve the visual drag position across re-renders
    const override =
      isDragging.current && dragPartId.current && dragCurrentOffset.current
        ? { id: dragPartId.current, ...dragCurrentOffset.current }
        : null;
    drawCanvas(override);
  }, [
    drawCanvas,
    grid,
    shapeGrid,
    selected,
    cellSize,
    spacing,
    padding,
    preview,
    shape,
    invert,
    symmetry,
    rows,
    cols,
    showNumbers,
    activePart,
    mode,
    parts,
  ]);

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

    if (mode === "move") {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const lr = row - p.offsetRow;
        const lc = col - p.offsetCol;
        if (lr >= 0 && lr < p.grid.length && lc >= 0 && lc < (p.grid[0]?.length ?? 0)) {
          onStrokeStart();
          setActivePartId(p.id);
          isDragging.current = true;
          dragPartId.current = p.id;
          dragStartCell.current = { row, col };
          dragPartInitialOffset.current = { offsetRow: p.offsetRow, offsetCol: p.offsetCol };
          dragCurrentOffset.current = { offsetRow: p.offsetRow, offsetCol: p.offsetCol };
          break;
        }
      }
      return;
    }

    onStrokeStart();
    const cell = grid[row][col];
    const val: 0 | 1 | -1 = e.button === 2 ? -1 : cell === 0 ? 1 : 0;
    drawValue.current = val;
    isDrawing.current = true;
    toggleCell(row, col, val);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { row, col } = getCellCoords(e);

    if (mode === "move") {
      if (isDragging.current && dragPartId.current && dragStartCell.current && dragPartInitialOffset.current) {
        const dRow = row - dragStartCell.current.row;
        const dCol = col - dragStartCell.current.col;
        const newOffsetRow = dragPartInitialOffset.current.offsetRow + dRow;
        const newOffsetCol = dragPartInitialOffset.current.offsetCol + dCol;
        dragCurrentOffset.current = { offsetRow: newOffsetRow, offsetCol: newOffsetCol };
        drawCanvas({ id: dragPartId.current, offsetRow: newOffsetRow, offsetCol: newOffsetCol });
      }
      return;
    }

    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    setSelected({ row, col });

    if (isDrawing.current) {
      toggleCell(row, col, drawValue.current);
    }
  };

  const handleMouseUp = () => {
    if (isDragging.current && dragPartId.current && dragCurrentOffset.current) {
      movePart(dragPartId.current, dragCurrentOffset.current.offsetRow, dragCurrentOffset.current.offsetCol);
    }
    isDrawing.current = false;
    isDragging.current = false;
    dragPartId.current = null;
    dragStartCell.current = null;
    dragPartInitialOffset.current = null;
    dragCurrentOffset.current = null;
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
        cursor: mode === "move" ? (isDragging.current ? "grabbing" : "grab") : "crosshair",
        imageRendering: "pixelated",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function starPathStr(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): string {
  const parts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    parts.push(
      `${i === 0 ? "M" : "L"} ${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`,
    );
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
