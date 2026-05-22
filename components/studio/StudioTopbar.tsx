"use client";

import { CheckCircle2, Download, Ellipsis, Expand, Share2 } from "lucide-react";
import type { LabStage } from "./types";

export function StudioTopbar({
  stage,
  onReset,
  onReport,
}: {
  stage: LabStage;
  onReset: () => void;
  onReport: () => void;
}) {
  const progress = [
    ["01", "Read workflow"],
    ["02", "Draft stack"],
    ["03", "Canvas"],
    ["04", "Demo trace"],
    ["05", "Eval plan"],
  ];

  return (
    <header className="studioTopbar">
      <div className="brandCluster">
        <img className="brandMark" src="/polygon-icon-primary-purple.svg" alt="" aria-hidden="true" />
        <div>
          <strong>Polygon OMS</strong>
          <span>Stack Studio</span>
        </div>
      </div>

      {stage !== "intake" && (
        <nav className="stageIndicator" aria-label="Studio progress">
          {progress.map(([number, label], index) => (
            <span
              key={label}
              className={
                (stage === "building" && index <= 1) || (stage === "lab" && index === 2)
                  ? "active"
                  : ""
              }
            >
              <b>{number}</b>
              {label}
            </span>
          ))}
        </nav>
      )}

      <div className="topbarActions">
        {stage === "intake" && (
          <>
            <button type="button">
              Saved draft
              <CheckCircle2 size={15} />
            </button>
            <button className="iconButton" type="button" aria-label="More actions">
              <Ellipsis size={17} />
            </button>
          </>
        )}
        {stage === "building" && (
          <>
            <button type="button" onClick={onReset}>
              <Expand size={15} />
              Lab
            </button>
            <button type="button" onClick={requestCanvasExport}>
              <Download size={15} />
              Export
            </button>
            <button className="avatarButton" type="button" aria-label="Account">
              K
            </button>
          </>
        )}
        {stage === "lab" && (
          <>
            <button type="button" onClick={() => void shareStudio()}>
              <Share2 size={15} />
              Share
            </button>
            <button type="button" onClick={requestCanvasExport}>
              <Download size={15} />
              Export
            </button>
            <button className="iconButton" type="button" onClick={onReport} aria-label="Open switch report">
              <Ellipsis size={17} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function requestCanvasExport() {
  window.dispatchEvent(new CustomEvent("oms:export-canvas"));
}

async function shareStudio() {
  const shareData = {
    title: "Polygon OMS Stack Studio",
    text: "Polygon OMS Stack Studio switch report",
    url: window.location.href,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard?.writeText(window.location.href);
  } catch {
    // Sharing can be cancelled by the user; no UI state needs to change.
  }
}
