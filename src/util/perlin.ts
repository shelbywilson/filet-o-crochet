type Gradient = {
  x: number;
  y: number;
};

type GradientMap = Record<string, Gradient>;
type MemoryMap = Record<string, number>;

class PerlinNoise {
  private seed: number;
  private gradients: GradientMap;
  private memory: MemoryMap;

  constructor(seed: number = Math.random()) {
    this.seed = seed;
    this.gradients = {};
    this.memory = {};
  }

  private rand(x: number, y: number): number {
    const angle = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
    return angle - Math.floor(angle);
  }

  private dot(gx: number, gy: number, x: number, y: number): number {
    return gx * x + gy * y;
  }

  private gradient(x: number, y: number): Gradient {
    const key = `${x},${y}`;
    if (this.gradients[key]) return this.gradients[key];

    const theta = this.rand(x, y) * 2 * Math.PI;
    const grad: Gradient = { x: Math.cos(theta), y: Math.sin(theta) };
    this.gradients[key] = grad;
    return grad;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  noise(x: number, y: number): number {
    const key = `${x},${y}`;
    if (this.memory[key] !== undefined) return this.memory[key];

    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    const sx = x - x0;
    const sy = y - y0;

    const g00 = this.gradient(x0, y0);
    const g10 = this.gradient(x1, y0);
    const g01 = this.gradient(x0, y1);
    const g11 = this.gradient(x1, y1);

    const n00 = this.dot(g00.x, g00.y, x - x0, y - y0);
    const n10 = this.dot(g10.x, g10.y, x - x1, y - y0);
    const n01 = this.dot(g01.x, g01.y, x - x0, y - y1);
    const n11 = this.dot(g11.x, g11.y, x - x1, y - y1);

    const u = this.fade(sx);
    const v = this.fade(sy);

    const nx0 = this.lerp(n00, n10, u);
    const nx1 = this.lerp(n01, n11, u);
    const result = this.lerp(nx0, nx1, v);

    const normalized = (result + 1) / 2;

    this.memory[key] = normalized;
    return normalized;
  }
}

export function generatePerlinGrid(
  width: number,
  height: number,
  scale: number = 0.1,
  threshold: number = 0
): number[][] {
  const perlin = new PerlinNoise();
  const grid: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const value = perlin.noise(x * scale, y * scale);
      row.push(value > threshold ? 1 : 0);
    }
    grid.push(row);
  }

  return grid;
}
