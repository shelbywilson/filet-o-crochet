import {
  trimArrayWithBorder,
  trimArrayWithBorderRectangular,
  trimArrayWithBorderCircular,
  shift,
  addSimpleBorder,
} from "../util/border";
import { generatePerlinGrid } from "../util/perlin";
import { Part } from "../types";
import { FontKey } from "../fonts";
import { Download } from "../Download";
import { GridSize } from "./GridSize";
import { Toggle } from "./Toggle";
import { Layers } from "./Layers";
import Pattern from "../Pattern";

interface IControls {
  cellSize: number;
  setCellSize: (v: number) => void;
  spacing: number;
  setSpacing: (v: number) => void;
  spacingMode: string;
  setSpacingMode: (v: string) => void;
  padding: number;
  setPadding: (v: number) => void;
  preview: boolean;
  setPreview: (v: boolean) => void;
  shape: "square" | "circle" | "cross" | "star";
  setShape: (v: "square" | "circle" | "cross" | "star") => void;
  invert: boolean;
  setInvert: (v: (prev: boolean) => boolean) => void;
  showNumbers: boolean;
  setShowNumbers: (v: boolean) => void;
  symmetry: { x: boolean; y: boolean; rotate90: boolean; rotate180: boolean };
  setSymmetry: (v: (prev: { x: boolean; y: boolean; rotate90: boolean; rotate180: boolean }) => { x: boolean; y: boolean; rotate90: boolean; rotate180: boolean }) => void;
  font: FontKey;
  setFont: (v: FontKey) => void;
  composedGrid: number[][];
  canvasRows: number;
  canvasCols: number;
  activePart: Part | undefined;
  parts: Part[];
  activePartId: string;
  setActivePartId: (id: string) => void;
  addPart: (part: Omit<Part, "id">) => void;
  removePart: (id: string) => void;
  renamePart: (id: string, name: string) => void;
  flipPartH: (id: string) => void;
  flipPartV: (id: string) => void;
  updateActivePart: (grid: number[][] | ((prev: number[][]) => number[][])) => void;
  updateCanvas: (transform: (grid: number[][]) => number[][]) => void;
  textToGrid: (text: string) => number[][];
}

export function Controls({
  cellSize, setCellSize,
  spacing, setSpacing,
  spacingMode, setSpacingMode,
  padding, setPadding,
  preview, setPreview,
  shape, setShape,
  invert, setInvert,
  showNumbers, setShowNumbers,
  symmetry, setSymmetry,
  font, setFont,
  composedGrid,
  canvasRows, canvasCols,
  activePart,
  parts, activePartId, setActivePartId,
  addPart, removePart, renamePart, flipPartH, flipPartV,
  updateActivePart,
  updateCanvas,
  textToGrid,
}: IControls) {
  const spacingPixels = spacing * cellSize;
  const spacingPercent = spacing;

  return (
    <div className="controls">
      <Layers
        parts={parts}
        activePartId={activePartId}
        setActivePartId={setActivePartId}
        addPart={addPart}
        removePart={removePart}
        renamePart={renamePart}
        flipPartH={flipPartH}
        flipPartV={flipPartV}
        font={font}
        setFont={setFont}
        textToGrid={textToGrid}
      />
      <div style={{ display: "flex", padding: 0 }}>
        <GridSize
          grid={activePart?.grid ?? [[]]}
          setGrid={updateActivePart}
          cellSize={cellSize}
        />
        <div style={{ borderLeft: "1px solid orangered", padding: "0.5rem" }}>
          <div>
            <Toggle
              value={preview}
              onChange={setPreview}
              labelOff="cut lines"
              labelOn="preview"
            />
            <label>
              <span>cell shape</span>
              <div>
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value as "square" | "circle" | "cross" | "star")}
                >
                  {["square", "circle", "cross", "star"].map((s) => (
                    <option key={s} value={s}>{s}</option>
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
                onChange={() => setInvert((prev) => !prev)}
              />
            </label>
          </div>
          <div>
            <label>
              <span>numbers</span>
              <input
                type="checkbox"
                checked={showNumbers}
                onChange={(e) => setShowNumbers(e.target.checked)}
              />
            </label>
          </div>
        </div>
      </div>
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
              onChange={() => setSymmetry((prev) => ({ ...prev, x: !prev.x }))}
            />
          </label>
          <label style={{ width: "2.5rem" }}>
            y
            <input
              type="checkbox"
              checked={symmetry.y}
              onChange={() => setSymmetry((prev) => ({ ...prev, y: !prev.y }))}
            />
          </label>
          <label style={{ width: "2.5rem" }}>
            90°
            <input
              type="checkbox"
              checked={symmetry.rotate90}
              onChange={() => setSymmetry((prev) => ({ ...prev, rotate90: !prev.rotate90 }))}
            />
          </label>
          <label style={{ width: "2.5rem" }}>
            180°
            <input
              type="checkbox"
              checked={symmetry.rotate180}
              onChange={() => setSymmetry((prev) => ({ ...prev, rotate180: !prev.rotate180 }))}
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
            <select value={spacingMode} onChange={(e) => setSpacingMode(e.target.value)}>
              <option value="percent">Percent</option>
              <option value="pixels">Pixels</option>
            </select>
          </div>
          <div>
            {spacingMode === "pixels" ? (
              <input
                type="number"
                min="0"
                max={cellSize * 0.95}
                step="0.5"
                value={spacingPixels}
                onChange={(e) => setSpacing(Number(e.target.value) / cellSize)}
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
          <span>border</span>
          <input
            type="range"
            min="0"
            max={0.5}
            step="0.1"
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
            updateCanvas((g) => {
              const rows = g.length, cols = g[0]?.length ?? 0;
              let minRow = rows, maxRow = -1, minCol = cols, maxCol = -1;
              for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++)
                  if (g[r][c] === 1) {
                    minRow = Math.min(minRow, r); maxRow = Math.max(maxRow, r);
                    minCol = Math.min(minCol, c); maxCol = Math.max(maxCol, c);
                  }
              if (maxRow === -1) return g;
              const cropped = g.slice(minRow, maxRow + 1).map((row) => row.slice(minCol, maxCol + 1));
              return trimArrayWithBorder(cropped, true, 1);
            })
          }
        >
          Snap
        </button>
        <button
          onClick={() =>
            updateCanvas((g) => {
              const rows = g.length, cols = g[0]?.length ?? 0;
              let minRow = rows, maxRow = -1, minCol = cols, maxCol = -1;
              for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++)
                  if (g[r][c] === 1) {
                    minRow = Math.min(minRow, r); maxRow = Math.max(maxRow, r);
                    minCol = Math.min(minCol, c); maxCol = Math.max(maxCol, c);
                  }
              if (maxRow === -1) return g;
              return g.slice(minRow, maxRow + 1).map((row) => row.slice(minCol, maxCol + 1));
            })
          }
        >
          Trim
        </button>
        <button onClick={() => updateCanvas((g) => trimArrayWithBorder(g, false, 2))}>
          Fill
        </button>
        <button onClick={() => updateCanvas(trimArrayWithBorderRectangular)}>
          Square
        </button>
        <button onClick={() => updateCanvas(trimArrayWithBorderCircular)}>
          Circle
        </button>
        <button onClick={() => updateCanvas(shift)}>
          Shift
        </button>
        <button onClick={() => updateCanvas(addSimpleBorder)}>
          Simple border
        </button>
        <button
          onClick={() =>
            updateCanvas(() =>
              generatePerlinGrid(
                canvasCols,
                canvasRows,
                0.05 + Math.random() * 0.95,
                0.25 + Math.random() * 0.5,
              )
            )
          }
        >
          noise
        </button>
      </div>
      <div>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(composedGrid)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "pattern.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Save JSON
        </button>
        <label>
          <span style={{ display: "inline-block" }} className="button">Load JSON</span>
          <input
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const loaded = JSON.parse(ev.target?.result as string);
                  addPart({ name: file.name.replace(".json", ""), source: "draw", grid: loaded, offsetRow: 0, offsetCol: 0 });
                } catch {}
              };
              reader.readAsText(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div>
        <Download>
          <Pattern
            grid={composedGrid}
            cellSize={cellSize}
            spacing={spacing}
            padding={padding}
            invert={invert}
            shape={shape}
            preview={false}
          />
        </Download>
      </div>
    </div>
  );
}
