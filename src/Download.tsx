import { downloadSVG } from "./util/download";

// interface IDownload {
//   grid: Array<Array<number>>;
//   cellSize: number;
//   spacing: number;
//   invert: boolean;
//   shape: "circle" | "square" | "cross";
//   children: React.ReactElement;
// }

export const Download = ({
  children,
}) => {
  return (
    <>
      <button onClick={() => downloadSVG()} role="button">
        Download SVG
      </button>

      <div id={'export'} style={{ position: "absolute", left: "-9999px" }}>
        {children}
        {/* <svg
          width={`${1 + cellSize * spacing + grid[0]?.length * cellSize}`}
          height={`${1 + cellSize * spacing + grid.length * cellSize}`}
          id="export"
          shape-rendering="crispEdges"
          vector-effect="non-scaling-stroke"
        >
          <path
            d={addBorderPath(grid, spacing, cellSize)}
            strokeWidth={1}
            shape-rendering="crispEdges"
            vector-effect="non-scaling-stroke"
          ></path>
          <g>
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  rowIndex={rowIndex}
                  colIndex={colIndex}
                  cell={cell}
                  cellSize={cellSize}
                  spacing={spacing}
                  preview={false}
                  shape={shape}
                  invert={invert}
                />
              ))
            )}
          </g>
        </svg> */}
      </div>
    </>
  );
};
