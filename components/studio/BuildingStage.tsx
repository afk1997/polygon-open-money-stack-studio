"use client";

import { CheckCircle2, Circle, Loader2, Pencil, Route, ShieldCheck, WalletCards } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { StudioInput } from "@/lib/types";
import { formatMoney } from "@/lib/engine";

const buildSteps = [
  "Read intake",
  "Map OMS modules",
  "Price providers",
  "Build canvas",
  "Prepare report",
];

export function BuildingStage({
  activeIndex,
  input,
  providerCount,
  useCaseName,
  onEdit,
}: {
  activeIndex: number;
  input: StudioInput;
  providerCount: number;
  useCaseName: string;
  onEdit: () => void;
}) {
  return (
    <section className="buildingStage">
      <BuildProgressRail activeIndex={activeIndex} />

      <motion.aside
        className="buildIntakeCard"
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.24 }}
      >
        <div className="buildIntakeHeader">
          <strong>Your intake</strong>
          <span>Will collapse</span>
        </div>
        <BuildFact icon={<WalletCards size={17} />} label="Mode" value={input.mode === "launch" ? "Launch New" : "Optimize Existing"} />
        <BuildFact icon={<Route size={17} />} label="Use case" value={useCaseName} />
        <hr />
        <BuildFact icon={<ShieldCheck size={17} />} label="Monthly volume" value={formatMoney(input.monthlyVolume)} />
        <BuildFact icon={<Circle size={17} />} label="Monthly transactions" value={input.monthlyTransactions.toLocaleString()} />
        <BuildFact icon={<ShieldCheck size={17} />} label={input.mode === "launch" ? "Benchmark stack" : "Current stack"} value={`${providerCount} providers selected`} />
        <button type="button" onClick={onEdit}>
          <Pencil size={14} />
          Edit intake
        </button>
      </motion.aside>

      <motion.div
        className="buildingCard"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="buildGlyph" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <h2>Building OMS stack</h2>
        <p>Drafting from your assumptions</p>
        <div className="buildRows">
          {buildSteps.map((step, index) => {
            const done = index < activeIndex;
            const active = index === activeIndex;
            return (
              <div key={step} className={done || active ? "active" : ""}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                {done ? <CheckCircle2 size={33} /> : <Loader2 size={33} className={active ? "spinning" : ""} />}
                <span>{step}</span>
                <em>{done ? "Completed" : active ? "In progress" : "Queued"}</em>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

function BuildProgressRail({ activeIndex }: { activeIndex: number }) {
  return (
    <nav className="buildProgressRail" aria-label="Build progress">
      {buildSteps.map((step, index) => {
        const active = index <= activeIndex;
        return (
          <span key={step} className={active ? "active" : ""}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            {step}
          </span>
        );
      })}
    </nav>
  );
}

function BuildFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="buildFact">
      {icon}
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}
