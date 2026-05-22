"use client";

import { Boxes, ClipboardList, RotateCcw } from "lucide-react";
import type { LabStage } from "./types";

export function StudioTopbar({
  stage,
  onReset,
  onPacket,
}: {
  stage: LabStage;
  onReset: () => void;
  onPacket: () => void;
}) {
  return (
    <header className="studioTopbar">
      <div className="brandCluster">
        <span className="brandMark">
          <Boxes size={18} />
        </span>
        <div>
          <strong>Polygon OMS Stack Studio</strong>
          <span>{stage === "lab" ? "Generated lab" : "Money movement intake"}</span>
        </div>
      </div>
      <nav className="stageIndicator" aria-label="Studio progress">
        <span className={stage === "intake" ? "active" : ""}>Intake</span>
        <i />
        <span className={stage === "building" ? "active" : ""}>Draft</span>
        <i />
        <span className={stage === "lab" ? "active" : ""}>Lab</span>
      </nav>
      <div className="topbarActions">
        <button type="button" onClick={onReset}>
          <RotateCcw size={15} />
          Edit intake
        </button>
        <button type="button" onClick={onPacket}>
          <ClipboardList size={15} />
          PMM packet
        </button>
      </div>
    </header>
  );
}
