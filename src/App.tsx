import { useState, useMemo, useRef, useCallback } from "react";
import { composeParts, composeShape } from "./util/compose";
import { fonts, FontKey } from "./fonts";
import { patterns } from "./patterns";
import { Part } from "./types";
import { Controls } from "./controls/Controls";
import { Toggle } from "./controls/Toggle";
import PatternCanvas from "./PatternCanvas";

function makeId() {
  return Math.random().toString(36).slice(2);
}

function makePart(overrides: Partial<Part> & { grid: number[][] }): Part {
  return {
    id: makeId(),
    name: "layer",
    source: "draw",
    offsetRow: 0,
    offsetCol: 0,
    ...overrides,
  };
}

const initialPart = makePart({
  name: "butterfly",
  source: "preset",
  grid: patterns["butterfly-1"]!,
});

export default function App() {
  const [cellSize, setCellSize] = useState(20);
  const [parts, setParts] = useState<Part[]>([initialPart]);
  const [activePartId, setActivePartId] = useState<string>(initialPart.id);
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const [spacing, setSpacing] = useState(0.1);
  const [padding, setPadding] = useState(0.1);
  const [spacingMode, setSpacingMode] = useState("pixels");
  const [preview, setPreview] = useState(true);
  const [shape, setShape] = useState<"square" | "circle" | "cross" | "star">("square");
  const [invert, setInvert] = useState(false);
  const [symmetry, setSymmetry] = useState({
    x: false,
    y: false,
    rotate90: false,
    rotate180: false,
  });
  const [font, setFont] = useState<FontKey>("font-1");
  const [showNumbers, setShowNumbers] = useState(false);
  const [mode, setMode] = useState<"draw" | "move">("draw");

  // --- Derived ---
  const activePart = parts.find((p) => p.id === activePartId) ?? parts[0];

  const canvasRows = useMemo(
    () => Math.max(...parts.map((p) => p.offsetRow + p.grid.length)),
    [parts],
  );
  const canvasCols = useMemo(
    () => Math.max(...parts.map((p) => p.offsetCol + (p.grid[0]?.length ?? 0))),
    [parts],
  );

  const composedGrid = useMemo(
    () => composeParts(parts, canvasRows, canvasCols),
    [parts, canvasRows, canvasCols],
  );

  const composedShape = useMemo(
    () => composeShape(parts, canvasRows, canvasCols),
    [parts, canvasRows, canvasCols],
  );

  // --- History ---
  const partsRef = useRef(parts);
  partsRef.current = parts;
  const activePartIdRef = useRef(activePartId);
  activePartIdRef.current = activePartId;
  const drawPartIdRef = useRef<string | null>(null);

  type Snapshot = { parts: Part[]; activePartId: string };
  const history = useRef<Snapshot[]>([{ parts, activePartId }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.current.length - 1;

  const pushHistory = useCallback(() => {
    const snapshot: Snapshot = {
      parts: partsRef.current.map((p) => ({ ...p, grid: p.grid.map((r) => [...r]) })),
      activePartId: activePartIdRef.current,
    };
    history.current = history.current.slice(0, historyIndex + 1);
    history.current.push(snapshot);
    setHistoryIndex(history.current.length - 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const next = historyIndex - 1;
    setHistoryIndex(next);
    setParts(history.current[next].parts);
    setActivePartId(history.current[next].activePartId);
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.current.length - 1) return;
    const next = historyIndex + 1;
    setHistoryIndex(next);
    setParts(history.current[next].parts);
    setActivePartId(history.current[next].activePartId);
  }, [historyIndex]);

  // --- Part operations ---
  const updateCanvas = useCallback(
    (transform: (grid: number[][]) => number[][]) => {
      pushHistory();
      const newGrid = transform(composedGrid);
      const newPart = makePart({ name: "canvas", source: "draw", grid: newGrid });
      setParts([newPart]);
      setActivePartId(newPart.id);
    },
    [pushHistory, composedGrid],
  );

  const updateActivePart = useCallback(
    (newGrid: number[][] | ((prev: number[][]) => number[][])) => {
      pushHistory();
      setParts((prevParts) =>
        prevParts.map((part) => {
          if (part.id !== activePartId) return part;
          const resolved =
            typeof newGrid === "function" ? newGrid(part.grid) : newGrid;
          return { ...part, grid: resolved };
        }),
      );
    },
    [pushHistory, activePartId],
  );

  const addPart = useCallback(
    (partData: Omit<Part, "id">) => {
      pushHistory();
      const newPart: Part = { ...partData, id: makeId() };
      setParts((prev) => [...prev, newPart]);
      setActivePartId(newPart.id);
    },
    [pushHistory],
  );

  const removePart = useCallback(
    (id: string) => {
      pushHistory();
      setParts((prev) => {
        // the first layer is never removed, just reset to a blank grid of the same size
        if (prev[0]?.id === id) {
          const first = prev[0];
          const blank = first.grid.map((row) => row.map(() => 0));
          return [
            { ...first, name: "layer 1", source: "draw", grid: blank, offsetRow: 0, offsetCol: 0 },
            ...prev.slice(1),
          ];
        }
        const next = prev.filter((p) => p.id !== id);
        if (activePartId === id && next.length > 0) {
          setActivePartId(next[next.length - 1].id);
        }
        return next.length > 0 ? next : prev; // always keep at least one
      });
    },
    [pushHistory, activePartId],
  );

  const movePart = useCallback((id: string, offsetRow: number, offsetCol: number) => {
    setParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, offsetRow, offsetCol } : p)),
    );
  }, []);

  const renamePart = useCallback((id: string, name: string) => {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const flipPartH = useCallback((id: string) => {
    pushHistory();
    setParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, grid: p.grid.map((row) => [...row].reverse()) } : p)),
    );
  }, [pushHistory]);

  const flipPartV = useCallback((id: string) => {
    pushHistory();
    setParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, grid: [...p.grid].reverse() } : p)),
    );
  }, [pushHistory]);

  // --- Cell toggling ---
  const toggleCell = useCallback(
    (canvasRow: number, canvasCol: number, val: 0 | 1 | -1) => {
      setParts((prevParts) => {
        const part = prevParts.find((p) => p.id === activePartId);
        if (!part) return prevParts;

        const localRow = canvasRow - part.offsetRow;
        const localCol = canvasCol - part.offsetCol;
        const pRows = part.grid.length;
        const pCols = part.grid[0]?.length ?? 0;

        if (localRow < 0 || localRow >= pRows || localCol < 0 || localCol >= pCols)
          return prevParts;

        return prevParts.map((p) => {
          if (p.id !== activePartId) return p;
          const newGrid = p.grid.map((r) => [...r]);

          newGrid[localRow][localCol] = val;
          if (symmetry.y) newGrid[localRow][pCols - localCol - 1] = val;
          if (symmetry.x) newGrid[pRows - localRow - 1][localCol] = val;
          if (symmetry.x && symmetry.y)
            newGrid[pRows - localRow - 1][pCols - localCol - 1] = val;
          if (symmetry.rotate90 && pRows === pCols) {
            newGrid[localCol][pRows - localRow - 1] = val;
            newGrid[pRows - localRow - 1][pCols - localCol - 1] = val;
            newGrid[pRows - localCol - 1][localRow] = val;
          }
          if (symmetry.rotate180)
            newGrid[pRows - localRow - 1][pCols - localCol - 1] = val;

          return { ...p, grid: newGrid };
        });
      });
    },
    [activePartId, symmetry],
  );

  // --- Text input ---
  function lineToGrid(line: string): number[][] {
    const alpha = fonts[font];
    const drafts = (line || " ").split("").map((letter) =>
      alpha[letter as keyof typeof alpha]
        ? alpha[letter as keyof typeof alpha]
        : [[0, 0], [0, 0], [0, 0]],
    );
    const maxHeight = Math.max(...drafts.map((arr) => arr.length));
    const paddedDrafts = drafts.map((arr, index) => {
      const diff = maxHeight - arr.length;
      const padding = Array(diff).fill(null).map(() => Array(arr[0].length).fill(0));
      const padded = [...arr, ...padding];
      return index > 0 ? padded.map((row) => row.slice(1)) : padded;
    });
    return paddedDrafts[0].map((_, rowIndex) =>
      paddedDrafts.flatMap((draft) => draft[rowIndex]),
    );
  }

  function textToGrid(text: string): number[][] {
    const lines = (text || " ").split("\n");
    const lineGrids = lines.map((line) => lineToGrid(line));
    const maxWidth = Math.max(...lineGrids.map((g) => g[0]?.length || 0));
    const paddedLineGrids = lineGrids.map((g) =>
      g.map((row) => [...row, ...Array(maxWidth - row.length).fill(0)]),
    );
    const result: number[][] = [];
    for (let i = 0; i < paddedLineGrids.length; i++) {
      result.push(...paddedLineGrids[i]);
      if (i < paddedLineGrids.length - 1) result.push(Array(maxWidth).fill(0));
    }
    return result;
  }

  return (
    <div className={`${preview ? "preview" : ""} container`}>
      <Controls
        cellSize={cellSize} setCellSize={setCellSize}
        spacing={spacing} setSpacing={setSpacing}
        spacingMode={spacingMode} setSpacingMode={setSpacingMode}
        padding={padding} setPadding={setPadding}
        preview={preview} setPreview={setPreview}
        shape={shape} setShape={setShape}
        invert={invert} setInvert={setInvert}
        showNumbers={showNumbers} setShowNumbers={setShowNumbers}
        symmetry={symmetry} setSymmetry={setSymmetry}
        font={font} setFont={setFont}
        composedGrid={composedGrid}
        canvasRows={canvasRows} canvasCols={canvasCols}
        activePart={activePart}
        parts={parts} activePartId={activePartId} setActivePartId={setActivePartId}
        addPart={addPart} removePart={removePart} renamePart={renamePart}
        flipPartH={flipPartH} flipPartV={flipPartV}
        updateActivePart={updateActivePart}
        updateCanvas={updateCanvas}
        textToGrid={textToGrid}
      />
      <div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <button onClick={undo} disabled={!canUndo}>undo</button>
          <button onClick={redo} disabled={!canRedo}>redo</button>
          <Toggle value={mode === "move"} onChange={(v) => setMode(v ? "move" : "draw")} labelOff="draw" labelOn="move" />
          <button
            onClick={() => updateCanvas((g) => g.map((row) => row.map(() => 0)))}
          >
            clear
          </button>
        </div>
        <PatternCanvas          
          grid={composedGrid}
          shapeGrid={composedShape}
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
          showNumbers={showNumbers}
          onStrokeStart={pushHistory}
          activePart={activePart}
          mode={mode}
          parts={parts}
          setActivePartId={setActivePartId}
          movePart={movePart}
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
