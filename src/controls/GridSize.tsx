const pxToInches = 0.014;

export function GridSize({ grid, setGrid, cellSize }) {
  const cols = grid[0]?.length || 0;
  const rows = grid.length || 0;

  function setCols(val, dir) {
    const currentCols = grid[0]?.length || 0;
    const newCols =
      typeof val === "number" && Math.abs(val) > 1
        ? val // Absolute value from input
        : currentCols + val; // Delta from buttons

    if (newCols < 1 || newCols === currentCols) return;

    const diff = newCols - currentCols;

    if (diff > 0) {
      setGrid(
        grid.map((row) =>
          dir === -1
            ? [...Array(diff).fill(0), ...row]
            : [...row, ...Array(diff).fill(0)]
        )
      );
    } else {
      const removeCount = Math.abs(diff);
      setGrid(
        grid.map((row) =>
          dir === -1 ? row.slice(removeCount) : row.slice(0, -removeCount)
        )
      );
    }
  }

  function setRows(val, dir) {
    const currentRows = grid.length || 0;
    const newRows =
      typeof val === "number" && Math.abs(val) > 1
        ? val // Absolute value from input
        : currentRows + val; // Delta from buttons

    if (newRows < 1 || newRows === currentRows) return;

    const diff = newRows - currentRows;
    const cols = grid[0]?.length || 0;

    if (diff > 0) {
      const newRowsArray = Array(diff)
        .fill(null)
        .map(() => Array(cols).fill(0));
      setGrid(
        dir === 1 ? [...grid, ...newRowsArray] : [...newRowsArray, ...grid]
      );
    } else {
      const removeCount = Math.abs(diff);
      setGrid(
        dir === 1 ? grid.slice(0, -removeCount) : grid.slice(removeCount)
      );
    }
  }

  return (
    <div className="grid-size-container">
      <div className="col-controls">
        <div className="col-controls-buttons">
          <button onClick={() => setCols(1, -1)}>+</button>
          <button onClick={() => setCols(-1, -1)}>-</button>
        </div>
        <div className="col-value">{cols}</div>
        <div className="col-controls-buttons">
          <button onClick={() => setCols(-1, 1)}>-</button>
          <button onClick={() => setCols(1, 1)}>+</button>
        </div>
      </div>
      <div className="row-controls">
        <div className="row-controls-buttons">
          <button onClick={() => setRows(1, -1)}>+</button>
          <button onClick={() => setRows(-1, -1)}>-</button>
        </div>
        <div className="row-value">{rows}</div>
        <div className="row-controls-buttons">
          <button onClick={() => setRows(-1, 1)}>-</button>
          <button onClick={() => setRows(1, 1)}>+</button>
        </div>
      </div>
      <div style={{ marginTop: "0.5rem", position: "relative" }}>
        <p style={{ position: "relative", margin: 0 }}>
          <div
            style={{
              position: "absolute",
              width: "100%",
              top: "50%",
              borderTop: "1px solid #fff",
            }}
          ></div>
          <div
            style={{
              position: "relative",
              width: "100%",
              textAlign: "center",
              borderRight: "1px solid #fff",
            }}
          >
            <span style={{ background: "rgb(40, 40, 40", padding: '0 0.5rem' }}>
              {(cols * cellSize * pxToInches).toFixed(1)}"
            </span>
          </div>
        </p>
        <p style={{ position: "absolute", top: 0, height: "100%", margin: 0 }}>
          <div
            style={{
              position: "absolute",
              height: "100%",
              left: "0.5rem",
              borderLeft: "1px solid #fff",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              height: "100%",
              display: 'flex',
              width: '1rem',
              alignItems: 'center',
              borderBottom: "1px solid #fff",
            }}
          >
            <span style={{ background: "rgb(40, 40, 40", padding: '0.5rem 0', whiteSpace: 'nowrap' }}>
              {(rows * cellSize * pxToInches).toFixed(1)}"
            </span>
          </div>
        </p>
      </div>
    </div>
  );
}
