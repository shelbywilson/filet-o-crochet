function saveSVG(svg: SVGSVGElement, filename: string) {
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function cloneExport(selector: string) {
  const svg = document.querySelector<SVGSVGElement>(selector);
  if (!svg) return null;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll(".hover, .target").forEach((el) => el.remove());
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return clone;
}

/** Hairline outlines only, for a cutter / plotter. */
export const downloadCutLines = () => {
  const clone = cloneExport("#export-cut-lines > svg");
  if (!clone) return;

  clone.querySelectorAll("rect, circle, path").forEach((el) => {
    el.setAttribute("stroke-width", "0.001mm");
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "rgb(0, 0, 0)");
  });

  saveSVG(clone, "cut-lines.svg");
};

const HOLE_FILL = "rgb(40, 40, 40)";

/** Path data for an element in the svg's coordinate space (handles the rect/circle/path shapes Pattern draws). */
function absolutePath(el: SVGGraphicsElement): string {
  const m = el.getCTM();
  if (!m) return "";
  const pt = (x: number, y: number) => {
    const p = new DOMPoint(x, y).matrixTransform(m);
    return `${+p.x.toFixed(3)},${+p.y.toFixed(3)}`;
  };
  const num = (name: string) => parseFloat(el.getAttribute(name) ?? "0");

  if (el instanceof SVGRectElement) {
    const [x, y, w, h] = [num("x"), num("y"), num("width"), num("height")];
    return `M${pt(x, y)} L${pt(x + w, y)} L${pt(x + w, y + h)} L${pt(x, y + h)} Z`;
  }
  if (el instanceof SVGCircleElement) {
    const [cx, cy] = [num("cx"), num("cy")];
    const r = +(num("r") * Math.hypot(m.a, m.b)).toFixed(3);
    return `M${pt(cx - num("r"), cy)} A${r},${r} 0 1 0 ${pt(cx + num("r"), cy)} A${r},${r} 0 1 0 ${pt(cx - num("r"), cy)} Z`;
  }
  if (el instanceof SVGPathElement) {
    // Pattern's paths only use absolute M / L / Z
    return (el.getAttribute("d") ?? "").replace(
      /([ML])\s*(-?[\d.]+(?:e-?\d+)?)[\s,]+(-?[\d.]+(?:e-?\d+)?)/gi,
      (_, cmd, x, y) => `${cmd.toUpperCase()}${pt(parseFloat(x), parseFloat(y))} `,
    ).replace(/\s+/g, " ").trim();
  }
  return "";
}

/**
 * Artwork matching the on-screen preview, for Figma / Illustrator etc. The background is
 * transparent so it can be laid over other artwork.
 * - showEmptyGrid: the lace is one white path (outline + filled cells) with the mesh holes cut out
 * - otherwise: only the filled cells
 */
export const downloadArtwork = (showEmptyGrid: boolean) => {
  const svg = document.querySelector<SVGSVGElement>("#export-artwork > svg");
  if (!svg) return;

  const outline = svg.querySelector<SVGPathElement>(":scope > g > path");
  const cells = [...svg.querySelectorAll<SVGGraphicsElement>("rect, circle, path")].filter(
    (el) => el !== outline,
  );
  const shapes = showEmptyGrid
    ? [outline, ...cells.filter((el) => el.getAttribute("fill") === HOLE_FILL)]
    : cells.filter((el) => el.getAttribute("fill") === "#fff");
  const d = shapes.filter((el) => el !== null).map(absolutePath).join(" ");

  const width = svg.getAttribute("width") ?? "0";
  const height = svg.getAttribute("height") ?? "0";
  const NS = "http://www.w3.org/2000/svg";
  const out = document.createElementNS(NS, "svg");
  out.setAttribute("xmlns", NS);
  out.setAttribute("width", width);
  out.setAttribute("height", height);
  out.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const lace = document.createElementNS(NS, "path");
  lace.setAttribute("id", "lace");
  lace.setAttribute("d", d);
  lace.setAttribute("fill", "#fff");
  // evenodd cuts the holes out of the outline; filled cells alone don't overlap, so it's harmless there
  lace.setAttribute("fill-rule", "evenodd");
  out.appendChild(lace);

  saveSVG(out, "pattern.svg");
};
