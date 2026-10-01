export interface Part {
  id: string;
  name: string;
  source: "draw" | "preset" | "text" | "noise";
  grid: number[][];
  offsetRow: number;
  offsetCol: number;
}
