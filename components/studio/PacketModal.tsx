"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import type { Recommendation, StudioInput } from "@/lib/types";
import { buildExportPitch, formatMoney } from "@/lib/engine";

export function PacketModal({
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
        className="packetModal"
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button className="modalClose" type="button" onClick={onClose} aria-label="Close PMM packet">
          <X size={18} />
        </button>
        <span className="kicker">PMM packet</span>
        <h2>{recommendation.title}</h2>
        <div className="packetGrid">
          <article>
            <strong>Executive memo</strong>
            <p>{recommendation.narrative}</p>
          </article>
          <article>
            <strong>6-slide pitch</strong>
            <ol>
              <li>Fragmented stack or benchmark build cost.</li>
              <li>Polygon OMS architecture and module map.</li>
              <li>Provider replacement, wrap, or benchmark story.</li>
              <li>{formatMoney(recommendation.costModel.firstYearNetSavings)} modeled first-year impact.</li>
              <li>Compliance and security controls.</li>
              <li>Launch or migration roadmap.</li>
            </ol>
          </article>
          <article>
            <strong>Battlecard</strong>
            <p>{recommendation.depthMoment}</p>
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
