import Cell from "./Cell";
import { addBorderPath } from "./util/border";

interface IPattern {
  grid: number[][];
  cellSize: number;
  spacing: number;
  padding: number;
  preview: boolean;
  shape: "circle" | "square" | "cross";
  invert: boolean;
  toggleCell?: (i: number, j: number, val: 0 | 1 | -1) => void;
  setSelected?: ({ row, col }: { row: number; col: number }) => void;
  selected?: { row: number; col: number } | null;
  symmetry?: { x?: boolean; y?: boolean; z?: boolean; rotate90?: boolean; rotate180?: boolean } | null;
}

export default function Pattern({
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
}: IPattern) {
  const rows = grid.length || 0;
  const cols = grid[0]?.length || 0;
  const isDownload = !setSelected;
  return (
    <svg
      id={"pattern"}
      style={
        isDownload
          ? {}
          : {
              maxWidth: cellSize * spacing + cols * cellSize,
              height: "min-content",
            }
      }
      shape-rendering="crispEdges"
      vector-effect="non-scaling-stroke"
      viewBox={
        isDownload
          ? ""
          : `0 0 ${2 * cellSize + cellSize * spacing + cols * cellSize} ${
              2 * cellSize + cellSize * spacing + rows * cellSize
            }`
      }
      width={
        isDownload
          ? `${2 * cellSize + cellSize * spacing + grid[0]?.length * cellSize}`
          : ""
      }
      height={
        isDownload
          ? `${2 * cellSize + cellSize * spacing + grid.length * cellSize}`
          : ""
      }
    >
      <g transform={`translate(${cellSize},${cellSize})`}>
        <path
          d={addBorderPath(grid, spacing, cellSize, padding)}
          fill={preview ? "#fff" : "none"}
          stroke={preview ? "#fff" : "red"}
          strokeWidth={1}
          shape-rendering="crispEdges"
          vector-effect="non-scaling-stroke"
        ></path>
        {grid.map((row: number[], rowIndex: number) =>
          row.map((cell: number, colIndex: number) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              rowIndex={rowIndex}
              colIndex={colIndex}
              cell={cell}
              cellSize={cellSize}
              spacing={spacing}
              preview={preview}
              shape={shape}
              invert={invert}
              toggleCell={toggleCell}
              setSelected={setSelected}
            />
          )),
        )}
        {selected ? (
          <rect
            x={selected.col * cellSize}
            y={selected.row * cellSize}
            width={cellSize}
            height={cellSize}
            fill="none"
            className="hover"
            stroke={preview ? "red" : "aliceblue"}
            strokeWidth="2"
            pointerEvents="none"
          />
        ) : (
          <></>
        )}
        {symmetry && selected && selected.row !== null && selected.col !== null ? (
          <>
            {/* Horizontal reflection (x-axis) */}
            {symmetry.x && (
              <rect
                x={selected.col * cellSize}
                y={(grid.length - selected.row - 1) * cellSize}
                width={cellSize}
                height={cellSize}
                fill="none"
                className="hover"
                stroke={preview ? "red" : "aliceblue"}
                strokeWidth="2"
                pointerEvents="none"
              />
            )}

            {/* Vertical reflection (y-axis) */}
            {symmetry.y && (
              <rect
                x={(grid[0]?.length - selected.col - 1) * cellSize}
                y={selected.row * cellSize}
                width={cellSize}
                height={cellSize}
                fill="none"
                className="hover"
                stroke={preview ? "red" : "aliceblue"}
                strokeWidth="2"
                pointerEvents="none"
              />
            )}

            {/* Diagonal reflection or both x and y */}
            {((symmetry.x && symmetry.y) || symmetry.z) && (
              <rect
                x={(grid[0]?.length - selected.col - 1) * cellSize}
                y={(grid.length - selected.row - 1) * cellSize}
                width={cellSize}
                height={cellSize}
                fill="none"
                className="hover"
                stroke={preview ? "red" : "aliceblue"}
                strokeWidth="2"
                pointerEvents="none"
              />
            )}

            {/* 90° Rotational symmetry (4-way) */}
            {symmetry.rotate90 && grid.length === grid[0]?.length && (
              <>
                {/* 90° clockwise */}
                <rect
                  x={selected.row * cellSize}
                  y={(grid.length - selected.col - 1) * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="none"
                  className="hover"
                  stroke={preview ? "red" : "aliceblue"}
                  strokeWidth="2"
                  pointerEvents="none"
                />

                {/* 180° */}
                <rect
                  x={(grid[0].length - selected.col - 1) * cellSize}
                  y={(grid.length - selected.row - 1) * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="none"
                  className="hover"
                  stroke={preview ? "red" : "aliceblue"}
                  strokeWidth="2"
                  pointerEvents="none"
                />

                {/* 270° clockwise */}
                <rect
                  x={(grid.length - selected.row - 1) * cellSize}
                  y={selected.col * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="none"
                  className="hover"
                  stroke={preview ? "red" : "aliceblue"}
                  strokeWidth="2"
                  pointerEvents="none"
                />
              </>
            )}

            {/* 180° Rotational symmetry (2-way) */}
            {symmetry.rotate180 && (
              <rect
                x={(grid[0]?.length - selected.col - 1) * cellSize}
                y={(grid.length - selected.row - 1) * cellSize}
                width={cellSize}
                height={cellSize}
                fill="none"
                className="hover"
                stroke={preview ? "red" : "aliceblue"}
                strokeWidth="2"
                pointerEvents="none"
              />
            )}
          </>
        ) : null}
      </g>
    </svg>
  );
}
