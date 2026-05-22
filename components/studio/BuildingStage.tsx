"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const buildSteps = [
  "Read intake",
  "Map OMS modules",
  "Price providers",
  "Build canvas",
  "Prepare packet",
];

export function BuildingStage({ activeIndex }: { activeIndex: number }) {
  return (
    <section className="buildingStage">
      <motion.div
        className="buildingCard"
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <span className="kicker">Building OMS stack</span>
        <h2>Drafting from your assumptions</h2>
        <div className="buildRows">
          {buildSteps.map((step, index) => {
            const done = index < activeIndex;
            const active = index === activeIndex;
            return (
              <div key={step} className={done || active ? "active" : ""}>
                {done ? <CheckCircle2 size={18} /> : <Loader2 size={18} className={active ? "spinning" : ""} />}
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
