import { ReactNode, useState } from "react";
import { downloadArtwork, downloadCutLines } from "./util/download";

interface IDownload {
  cutLines: ReactNode;
  artwork: ReactNode;
}

export const Download = ({ cutLines, artwork }: IDownload) => {
  const [showEmptyGrid, setShowEmptyGrid] = useState(true);

  return (
    <>
      <div>
        <button onClick={downloadCutLines} role="button">
          Download cut lines
        </button>
        <button onClick={() => downloadArtwork(showEmptyGrid)} role="button">
          Download SVG
        </button>
      </div>
      <label>
        <span>show empty grid</span>
        <input
          type="checkbox"
          checked={showEmptyGrid}
          onChange={(e) => setShowEmptyGrid(e.target.checked)}
        />
      </label>

      {/* off-screen renders that the buttons serialize */}
      <div style={{ position: "absolute", left: "-9999px" }}>
        <div id="export-cut-lines">{cutLines}</div>
        <div id="export-artwork">{artwork}</div>
      </div>
    </>
  );
};
