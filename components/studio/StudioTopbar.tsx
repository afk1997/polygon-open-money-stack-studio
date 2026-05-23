"use client";

import { CheckCircle2, Download, Edit3, Ellipsis, Share2 } from "lucide-react";
import type { LabStage } from "./types";

export function StudioTopbar({
  stage,
  draftSaved,
  onReset,
  onReport,
}: {
  stage: LabStage;
  draftSaved: boolean;
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
          <span className="draftStatus">
            {draftSaved ? "Saved draft" : "Unsaved draft"}
            {draftSaved && <CheckCircle2 size={15} />}
          </span>
        )}
        {stage === "building" && (
          <button type="button" onClick={onReset}>
            <Edit3 size={15} />
            Edit intake
          </button>
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
