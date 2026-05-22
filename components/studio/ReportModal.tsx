"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import type { Recommendation, StudioInput } from "@/lib/types";
import { buildExportPitch, formatMoney } from "@/lib/engine";

export function ReportModal({
  input,
  recommendation,
  open,
  onClose,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modalLayer" role="dialog" aria-modal="true">
      <motion.section
        className="reportModal"
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button className="modalClose" type="button" onClick={onClose} aria-label="Close switch report">
          <X size={18} />
        </button>
        <span className="kicker">Switch report</span>
        <h2>{recommendation.title}</h2>
        <div className="reportGrid">
          <article>
            <strong>Executive brief</strong>
            <p>{recommendation.narrative}</p>
          </article>
          <article>
            <strong>Business case</strong>
            <p>
              First-year modeled impact is {formatMoney(recommendation.costModel.firstYearNetSavings)} with
              {` ${recommendation.costModel.selectedProviderCount}`} provider cost lines attached.
            </p>
          </article>
          <article>
            <strong>Switch plan</strong>
            <ol>
              {recommendation.playbook.phases.map((phase) => (
                <li key={phase}>{phase}</li>
              ))}
            </ol>
          </article>
          <article>
            <strong>Source appendix</strong>
            <textarea suppressHydrationWarning readOnly value={buildExportPitch(input)} />
          </article>
        </div>
      </motion.section>
    </div>
  );
}
