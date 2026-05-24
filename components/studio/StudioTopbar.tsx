"use client";

import { ChevronDown, Download, Ellipsis, Maximize2, Share2 } from "lucide-react";
import type { LabStage } from "./types";

export function StudioTopbar({
  stage,
  onGoLab,
  onReport,
}: {
  stage: LabStage;
  onGoLab: () => void;
  onReport: () => void;
}) {
  const progress = [
    ["01", "Read workflow"],
    ["02", "Draft stack"],
    ["03", "Canvas"],
  ];

  return (
    <header className={`studioTopbar ${stage === "building" ? "buildingTopbar" : ""} ${stage === "lab" ? "labTopbar" : ""}`}>
      <div className="brandCluster">
        <img className="brandMark" src="/polygon-icon-primary-purple.svg" alt="" aria-hidden="true" />
        <div>
          <strong>Polygon OMS</strong>
          <span>Orchestration Studio</span>
        </div>
      </div>

      {stage !== "intake" && stage !== "building" && (
        <nav className="stageIndicator" aria-label="Studio progress">
          {progress.map(([number, label], index) => (
            <span
              key={label}
              className={
                stage === "lab" && index === 2
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
          <span className="draftStatus">Unofficial path towards Polygon OMS</span>
        )}
        {stage === "building" && (
          <>
            <button type="button" onClick={onGoLab}>
              <Maximize2 size={15} />
              Lab
            </button>
            <button type="button" onClick={onReport}>
              <Download size={15} />
              Export
            </button>
            <button className="avatarButton topbarAvatar" type="button" onClick={openSettings} aria-label="Open settings">
              K
              <ChevronDown size={14} />
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

function openSettings() {
  window.location.href = "/settings";
}

function requestCanvasExport() {
  window.dispatchEvent(new CustomEvent("oms:export-canvas"));
}

async function shareStudio() {
  const shareData = {
    title: "Polygon OMS Orchestration Studio",
    text: "Polygon OMS Orchestration Studio switch report",
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
