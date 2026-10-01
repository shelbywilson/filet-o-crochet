import { useState, useRef, useEffect } from "react";
import { Part } from "../types";
import { fonts, FontKey } from "../fonts";
import { patterns } from "../patterns";

interface ILayers {
  parts: Part[];
  activePartId: string;
  setActivePartId: (id: string) => void;
  addPart: (part: Omit<Part, "id">) => void;
  removePart: (id: string) => void;
  renamePart: (id: string, name: string) => void;
  flipPartH: (id: string) => void;
  flipPartV: (id: string) => void;
  font: FontKey;
  setFont: (f: FontKey) => void;
  textToGrid: (text: string) => number[][];
}

const sourceColors: Record<Part["source"], string> = {
  draw: "#555",
  preset: "steelblue",
  text: "mediumpurple",
  noise: "seagreen",
};

export function Layers({
  parts,
  activePartId,
  setActivePartId,
  addPart,
  removePart,
  renamePart,
  flipPartH,
  flipPartV,
  font,
  setFont,
  textToGrid,
}: ILayers) {
  const [textInput, setTextInput] = useState("");
  const [addMode, setAddMode] = useState<"text" | "draw" | null>(null);

  const handleAddText = () => {
    if (!textInput.trim()) return;
    addPart({
      name: textInput,
      source: "text",
      grid: textToGrid(textInput),
      offsetRow: 0,
      offsetCol: 0,
    });
    setTextInput("");
    setAddMode(null);
  };

  const handleAddDraw = () => {
    addPart({
      name: "layer",
      source: "draw",
      grid: Array(16).fill(null).map(() => Array(16).fill(0)),
      offsetRow: 0,
      offsetCol: 0,
    });
    setAddMode(null);
  };

  return (
    <div>
      <div style={{ marginBottom: "0.5rem", borderBottom: "1px solid #444", paddingBottom: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>layers</span>
          <select
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              addPart({
                name: e.target.value,
                source: "preset",
                grid: patterns[e.target.value as keyof typeof patterns]!,
                offsetRow: 0,
                offsetCol: 0,
              });
            }}
            style={{ fontSize: "0.75rem" }}
          >
            <option value="">+ preset</option>
            {Object.keys(patterns).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button onClick={() => setAddMode(addMode === "draw" ? null : "draw")} style={{ fontSize: "0.75rem" }}>+ draw</button>
          <button onClick={() => setAddMode(addMode === "text" ? null : "text")} style={{ fontSize: "0.75rem" }}>+ text</button>
        </div>

        {addMode === "text" && (
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.4rem" }}>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value as FontKey)}
              style={{ fontSize: "0.75rem" }}
            >
              {Object.keys(fonts).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <input
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddText(); if (e.key === "Escape") setAddMode(null); }}
              placeholder="type text…"
              style={{ fontSize: "0.75rem", flex: 1 }}
            />
            <button onClick={handleAddText} style={{ fontSize: "0.75rem" }}>add</button>
          </div>
        )}

        {addMode === "draw" && (
          <div style={{ marginBottom: "0.4rem" }}>
            <button onClick={handleAddDraw} style={{ fontSize: "0.75rem" }}>add blank 16×16</button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {[...parts].reverse().map((part) => {
            const isActive = part.id === activePartId;
            return (
              <div
                key={part.id}
                onClick={() => setActivePartId(part.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.25rem 0.4rem",
                  background: isActive ? "rgba(255,100,0,0.15)" : "transparent",
                  border: isActive ? "1px solid orangered" : "1px solid transparent",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "0.5rem",
                    height: "0.5rem",
                    borderRadius: "50%",
                    background: sourceColors[part.source],
                    flexShrink: 0,
                  }}
                />
                <input
                  value={part.name}
                  onChange={(e) => renamePart(part.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    color: "inherit",
                    fontSize: "inherit",
                    minWidth: 0,
                  }}
                />
                <span style={{ fontSize: "0.7rem", flexShrink: 0 }}>
                  {part.grid[0]?.length ?? 0}×{part.grid.length}
                </span>
                <span style={{ fontSize: "0.7rem", flexShrink: 0 }}>
                  {part.offsetRow},{part.offsetCol}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); flipPartH(part.id); }}
                  style={{ fontSize: "0.7rem", flexShrink: 0 }}
                  title="Flip horizontal"
                >↔</button>
                <button
                  onClick={(e) => { e.stopPropagation(); flipPartV(part.id); }}
                  style={{ fontSize: "0.7rem", flexShrink: 0 }}
                  title="Flip vertical"
                >↕</button>
                <button
                  onClick={(e) => { e.stopPropagation(); removePart(part.id); }}
                  style={{ fontSize: "0.7rem", flexShrink: 0 }}
                  disabled={parts.length === 1}
                >✕</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
