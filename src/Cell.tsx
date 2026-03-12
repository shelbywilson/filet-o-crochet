import { useEffect } from "react";

interface ICell {
  rowIndex: number;
  colIndex: number;
  cell: number;
  cellSize: number;
  spacing: number;
  preview: boolean;
  invert: boolean;
  shape: "circle" | "square" | "cross";
  toggleCell?: (i: number, j: number, val: 0 | 1 | -1) => void;
  setSelected?: ({ row, col }: { row: number; col: number }) => void;
}

export default function Cell({
  rowIndex,
  colIndex,
  cell,
  cellSize,
  spacing,
  preview,
  invert,
  shape,
  toggleCell,
  setSelected,
}: ICell) {
  if (invert) {
    if (cell == 0) {
      cell = 1;
    } else if (cell == 1) {
      cell = 0;
    }
  }

  const getCross = () => {
    const s = spacing / 2.5; // start point
    const e = 1 - spacing / 2.5; // end point
    const m = 0.5; // middle
    const w = spacing / 8; // stroke width as percentage

    if (cell == 1) {
      return <></>;
    }

    return (
      <g
        transform={`translate(${colIndex * cellSize}, ${rowIndex * cellSize})`}
      >
        <path
          d={`
        M ${s + w} ${s}
        L ${m} ${m - w}
        L ${e - w} ${s}
        L ${e} ${s + w}
        L ${m + w} ${m}
        L ${e} ${e - w}
        L ${e - w} ${e}
        L ${m} ${m + w}
        L ${s + w} ${e}
        L ${s} ${e - w}
        L ${m - w} ${m}
        L ${s} ${s + w}
        Z
      `}
          transform={`scale(${cellSize})`}
          fill={"rgb(40, 40, 40)"}
          stroke={!preview ? "red" : ""}
          strokeWidth={0.05}
        />
      </g>
    );
  };

  useEffect(() => {
    const cb = (event) => {
      event.preventDefault();
    };
    window.addEventListener("contextmenu", cb);

    return () => window.removeEventListener("contextmenu", cb);
  }, []);

  return (
    <>
      {cell != -1 ? (
        <>
          {preview ? (
            <>
              {shape == "circle" ? (
                <circle
                  cx={(colIndex + 0.5) * cellSize}
                  cy={(rowIndex + 0.5) * cellSize}
                  r={(cellSize * (1 - spacing)) / 2}
                  fill={cell == 1 ? "#fff" : "rgb(40, 40, 40)"}
                />
              ) : shape == "cross" ? (
                getCross()
              ) : (
                <rect
                  x={
                    colIndex * cellSize +
                    (cell == 0 ? (spacing * cellSize) / 2 : 0)
                  }
                  y={
                    rowIndex * cellSize +
                    (cell == 0 ? (spacing * cellSize) / 2 : 0)
                  }
                  width={cellSize - spacing * cellSize}
                  height={cellSize - spacing * cellSize}
                  fill={cell == 1 ? "#fff" : "rgb(40, 40, 40)"}
                  stroke={"none"}
                  strokeWidth={0}
                />
                /*<g
                  transform={`translate(${(colIndex + 0.5) * cellSize}, ${
                    (rowIndex + 0.5) * cellSize
                  })`}
                >
                   <ellipse
                    rx={(cellSize * (1 - spacing)) / 2}
                    ry={(cellSize * (1 - spacing)) / 3}
                    fill={cell == 1 ? "#fff" : "rgb(40, 40, 40)"}
                    style={{ transform: "rotate(-45deg)" }}
                  /> 
                </g>
                */
              )}
            </>
          ) : shape == "cross" ? (
            getCross()
          ) : cell == 0 ? (
            shape == "circle" ? (
              <circle
                cx={(colIndex + 0.5) * cellSize} // + (Math.random() * cellSize/4 - cellSize/8)} 
                cy={(rowIndex + 0.5) * cellSize} // + (Math.random() * cellSize/4 - cellSize/8)} 
                r={(cellSize * (1 - spacing)) / 2}
                fill="rgba(0,0,0,0)"
                stroke="red"
                strokeWidth="1"
              />
            ) : (
              <rect
                x={colIndex * cellSize + (spacing * cellSize) / 2}
                y={rowIndex * cellSize + (spacing * cellSize) / 2}
                width={cellSize - spacing * cellSize}
                height={cellSize - spacing * cellSize}
                fill={"rgba(0,0,0,0)"}
                stroke={"red"}
                strokeWidth="1"
              />
            )
          ) : (
            <></>
          )}
        </>
      ) : (
        <></>
      )}
      {toggleCell && setSelected ? (
        <rect
          className="target"
          x={colIndex * cellSize}
          y={rowIndex * cellSize}
          width={cellSize}
          height={cellSize}
          fill="rgba(0,0,0,0)"
          stroke="rgba(0,0,0,0)"
          onMouseDown={(e) => {
            let state = cell;
            if (invert) {
              if (invert) {
                if (state == 0) {
                  state = 1;
                } else if (state == 1) {
                  state = 0;
                }
              }
            }
            toggleCell(
              rowIndex,
              colIndex,
              e.button == 2 ? -1 : state == 0 ? 1 : 0,
            );
          }}
          onMouseEnter={() => setSelected({ row: rowIndex, col: colIndex })}
        />
      ) : (
        <></>
      )}
    </>
  );
}
