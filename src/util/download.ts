export const downloadSVG = () => {
  const svg = document.querySelector("#export > svg");
  const clone = svg.cloneNode(true);

  const elementsToRemove = clone.querySelectorAll(".hover, .target");
  elementsToRemove.forEach((el) => el.remove());

  const elementsToAdjustStroke = clone.querySelectorAll("rect, circle, path");
  elementsToAdjustStroke.forEach((el) => {
    el.setAttribute("stroke-width", "0.001mm");
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "rgb(0, 0, 0)");
  });

  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "grid.svg";
  link.click();
  URL.revokeObjectURL(url);
};
