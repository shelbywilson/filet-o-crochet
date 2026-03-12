import { useState, useEffect } from "react";
import {
  trimArrayWithBorder,
  trimArrayWithBorderRectangular,
  trimArrayWithBorderCircular,
  destroyEdges,
  shift,
  addSimpleBorder,
} from "./util/border";
import { generatePerlinGrid } from "./util/perlin";
import { patterns } from "./patterns";
import { alpha } from "./alphabet";
import { Download } from "./Download";
import { GridSize } from "./controls/GridSize";
import Pattern from "./Pattern";

export default function App() {
  const [cellSize, setCellSize] = useState(20);

  const [grid, setGrid] = useState(() => patterns["butterfly-1"]);

  const [rows, setRows] = useState(grid.length);
  const [cols, setCols] = useState(grid[0]?.length);
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [spacing, setSpacing] = useState(0.1);
  const [padding, setPadding] = useState(0.1);
  const [spacingMode, setSpacingMode] = useState("percent");
  const [preview, setPreview] = useState(true);
  const [shape, setShape] = useState<"square" | "circle" | "cross">("square");
  const [invert, setInvert] = useState(false);
  const [symmetry, setSymmetry] = useState({ x: false, y: false, z: false, rotate90: false, rotate180: false });

  const spacingPixels = spacing * cellSize;
  const spacingPercent = spacing;

  const toggleCell = (row, col, val) => {
    setGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      const rows = newGrid.length;
      const cols = newGrid[0].length;

      // Set the primary cell
      newGrid[row][col] = val;

      // Reflective symmetry (existing)
      if (symmetry.y) {
        newGrid[row][cols - col - 1] = val;
      }

      if (symmetry.x) {
        newGrid[rows - row - 1][col] = val;
      }

      if ((symmetry.x && symmetry.y) || symmetry.z) {
        newGrid[rows - row - 1][cols - col - 1] = val;
      }

      // Rotational symmetry (90°, 180°, 270°)
      if (symmetry.rotate90 && rows === cols) {
        // 90° clockwise: (row, col) -> (col, rows - row - 1)
        newGrid[col][rows - row - 1] = val;

        // 180°: (row, col) -> (rows - row - 1, cols - col - 1)
        newGrid[rows - row - 1][cols - col - 1] = val;

        // 270° clockwise: (row, col) -> (rows - col - 1, row)
        newGrid[rows - col - 1][row] = val;
      }

      // Rotational symmetry (180° only)
      if (symmetry.rotate180) {
        newGrid[rows - row - 1][cols - col - 1] = val;
      }

      return newGrid;
    });
  };

  useEffect(() => {
    if (rows != grid.length || cols != grid[0].length) {
      setGrid((prev) => {
        const newGrid = Array(rows)
          .fill(null)
          .map((_, rowIndex) =>
            Array(cols)
              .fill(null)
              .map((_, colIndex) => {
                if (rowIndex < prev.length && colIndex < prev[0].length) {
                  return prev[rowIndex][colIndex];
                }
                return 0;
              }),
          );
        return newGrid;
      });
    }
  }, [rows, cols]);

  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     let newRow = selected.row;
  //     let newCol = selected.col;

  //     switch (e.key) {
  //       case "ArrowUp":
  //         e.preventDefault();
  //         newRow = Math.max(0, selected.row - 1);
  //         break;
  //       case "ArrowDown":
  //         e.preventDefault();
  //         newRow = Math.min(rows - 1, selected.row + 1);
  //         break;
  //       case "ArrowLeft":
  //         e.preventDefault();
  //         newCol = Math.max(0, selected.col - 1);
  //         break;
  //       case "ArrowRight":
  //         e.preventDefault();
  //         newCol = Math.min(cols - 1, selected.col + 1);
  //         break;
  //       case "Enter":
  //         e.preventDefault();
  //         toggleCell(selected.row, selected.col);
  //         return;
  //       default:
  //         return;
  //     }

  //     setSelected({ row: newRow, col: newCol });
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, [selected]);

  useEffect(() => {
    if (rows != grid.length) {
      setRows(grid.length);
    }
    if (cols != grid[0]?.length) {
      setCols(grid[0]?.length);
    }
  }, [grid]);

  console.log(grid);

  function handleText(e) {
    const drafts = (e.target.value || " ").split("").map((letter) =>
      alpha[letter]
        ? alpha[letter]
        : [
            [0, 0],
            [0, 0],
            [0, 0],
          ],
    );

    const maxHeight = Math.max(...drafts.map((arr) => arr.length));

    const paddedDrafts = drafts.map((arr, index) => {
      const diff = maxHeight - arr.length;
      const padding = Array(diff)
        .fill(null)
        .map(() => Array(arr[0].length).fill(0));
      const padded = [...arr, ...padding];

      if (index > 0) {
        return padded.map((row) => row.slice(1));
      }
      return padded;
    });

    const joined = paddedDrafts[0].map((_, rowIndex) =>
      paddedDrafts.flatMap((draft) => draft[rowIndex]),
    );

    setGrid(joined);
  }

  return (
    <div className={`${preview ? "preview" : ""} container`}>
      <div className="controls">
        <div>
          <input type="text" onChange={handleText} />
        </div>
        <div>
          <label>
            <span>presets</span>
            <div>
              <select onChange={(e) => setGrid(patterns[e.target.value])}>
                {Object.keys(patterns).map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {pattern}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>
        <div>
          <button
            onClick={() =>
              setGrid(
                generatePerlinGrid(
                  cols,
                  rows,
                  0.05 + Math.random() * 0.95,
                  0.25 + Math.random() * 0.5,
                ),
              )
            }
          >
            noise
          </button>
          <button
            onClick={() =>
              setGrid((prev) => {
                return prev.map((row) =>
                  row.map((cell) => (cell == -1 ? -1 : 0)),
                );
                // return Array(rows)
                //   .fill(null)
                //   .map(() =>
                //     Array(cols)
                //       .fill(null)
                //       .map(() => 0)
                //   );
              })
            }
          >
            clear
          </button>
        </div>
        <div style={{ display: "flex", padding: 0 }}>
          <GridSize grid={grid} setGrid={setGrid} cellSize={cellSize} />
          <div style={{ borderLeft: "1px solid orangered", padding: "0.5rem" }}>
            <div>
              <label>
                <span>shape</span>
                <div>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                  >
                    {["square", "circle", "cross"].map((shape) => (
                      <option key={shape} value={shape}>
                        {shape}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
            <div>
              <label>
                <span>invert</span>
                <input
                  type="checkbox"
                  checked={invert}
                  onChange={(e) => setInvert((prev) => !prev)}
                />
              </label>
            </div>

            <div>
              <label>
                <span>{preview ? "preview" : "cut lines"}</span>
                <input
                  type="checkbox"
                  checked={preview}
                  onChange={(e) => setPreview(e.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>{" "}
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem",
            }}
          >
            <div>symmetry</div>
            <label style={{ width: "2.5rem" }}>
              x
              <input
                type="checkbox"
                checked={symmetry.x}
                onChange={(e) =>
                  setSymmetry((prev) => ({ ...prev, x: !prev.x }))
                }
              />
            </label>
            <label style={{ width: "2.5rem" }}>
              y
              <input
                type="checkbox"
                checked={symmetry.y}
                onChange={(e) =>
                  setSymmetry((prev) => ({ ...prev, y: !prev.y }))
                }
              />
            </label>
            <label style={{ width: "2.5rem" }}>
              z
              <input
                type="checkbox"
                checked={symmetry.z}
                onChange={(e) =>
                  setSymmetry((prev) => ({ ...prev, z: !prev.z }))
                }
              />
            </label>
            <label style={{ width: "2.5rem" }}>
              90°
              <input
                type="checkbox"
                checked={symmetry.rotate90}
                onChange={(e) =>
                  setSymmetry((prev) => ({ ...prev, rotate90: !prev.rotate90 }))
                }
              />
            </label>
            <label style={{ width: "2.5rem" }}>
              180°
              <input
                type="checkbox"
                checked={symmetry.rotate180}
                onChange={(e) =>
                  setSymmetry((prev) => ({ ...prev, rotate180: !prev.rotate180 }))
                }
              />
            </label>
          </div>
        </div>
        <div>
          <label>
            <span>
              Spacing <br /> {parseFloat((spacingPercent * 100).toFixed(1))}% /{" "}
              {parseFloat(spacingPixels.toFixed(1))}
              <span style={{ textTransform: "none" }}>px</span>
            </span>

            <div>
              <select
                value={spacingMode}
                onChange={(e) => setSpacingMode(e.target.value)}
              >
                <option value="percent">Percent</option>
                <option value="pixels">Pixels</option>
              </select>
            </div>
            <div>
              {spacingMode == "pixels" ? (
                <input
                  type="number"
                  min="0"
                  max={cellSize * 0.95}
                  step={"0.5"}
                  value={spacingPixels}
                  onChange={(e) =>
                    setSpacing(Number(e.target.value) / cellSize)
                  }
                />
              ) : (
                <input
                  type="range"
                  min="0"
                  max={0.95}
                  step={0.05}
                  value={spacing}
                  onChange={(e) => setSpacing(Number(e.target.value))}
                />
              )}
            </div>
          </label>
        </div>
        <div>
          <label>
            <span>padding</span>
            <input
              type="range"
              min="0"
              max={0.5}
              step={"0.1"}
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
            />
          </label>
        </div>
        <div>
          <label>
            <span>
              Cell size <br />
              {cellSize}
              <span style={{ textTransform: "none" }}>px</span>
            </span>
            <div>
              <input
                type="number"
                min="4"
                value={cellSize}
                onChange={(e) => setCellSize(Number(e.target.value))}
              />
            </div>
            <div>
              <input
                type="range"
                min="4"
                max="40"
                value={cellSize}
                onChange={(e) => setCellSize(Number(e.target.value))}
              />
            </div>
          </label>
        </div>
        <div>
          <button
            onClick={() =>
              setGrid(
                trimArrayWithBorder(grid, true, Math.ceil(Math.random() * 3)),
              )
            }
            role="button"
          >
            Snap
          </button>

          <button
            onClick={() => setGrid(trimArrayWithBorder(grid, false, 2))}
            role="button"
          >
            Fill
          </button>
          <button
            onClick={() => setGrid(trimArrayWithBorderRectangular(grid))}
            role="button"
          >
            Square
          </button>

          <button
            onClick={() => setGrid(trimArrayWithBorderCircular(grid))}
            role="button"
          >
            Circle
          </button>

          <button onClick={() => setGrid(destroyEdges(grid))} role="button">
            Destroy edges
          </button>

          <button onClick={() => setGrid(shift(grid))} role="button">
            Shift
          </button>

          <button onClick={() => setGrid(addSimpleBorder(grid))} role="button">
            Simple border
          </button>
        </div>
        <div>
          <Download>
            <Pattern
              grid={grid}
              cellSize={cellSize}
              spacing={spacing}
              invert={invert}
              shape={shape}
              preview={false}
            />
          </Download>
        </div>
      </div>
      <div>
        <Pattern
          grid={grid}
          cellSize={cellSize}
          spacing={spacing}
          padding={padding}
          invert={invert}
          shape={shape}
          preview={preview}
          selected={selected}
          setSelected={setSelected}
          symmetry={symmetry}
          toggleCell={toggleCell}
        />
      </div>
      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          color: "yellow",
        }}
      >
        {selected.col}, {selected.row}
      </div>
    </div>
  );
}
