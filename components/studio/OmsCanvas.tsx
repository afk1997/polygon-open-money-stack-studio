"use client";

import {
  Banknote,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Crosshair,
  Database,
  Expand,
  GitBranch,
  LockKeyhole,
  Network,
  Route,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ComponentType } from "react";
import type { OMSModule, Recommendation, StudioInput } from "@/lib/types";
import { groupProvidersByModule } from "./useStudioModel";

const moduleIcons: Record<string, ComponentType<{ size?: number }>> = {
  "wallet-infra": WalletCards,
  crosschain: Network,
  "stablecoin-orchestration": Banknote,
  ramps: LockKeyhole,
  "cross-border": Route,
  "blockchain-integration": Database,
  cdk: Boxes,
  "compliance-security": ShieldCheck,
};

export function OmsCanvas({
  input,
  recommendation,
  requiredModules,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  requiredModules: OMSModule[];
}) {
  const groups = groupProvidersByModule(input.selectedProviderIds);
  const topModules = requiredModules.slice(0, 4);
  const providerNames = groups.flatMap((group) => group.providers.map((provider) => provider.name)).slice(0, 10);

  return (
    <section className="canvasShell">
      <div className="canvasToolbar">
        <div className="canvasCrumb">
          <span className="miniMark" />
          <strong>Polygon OMS</strong>
          <em>Draft</em>
          <small>Last saved 2 min ago</small>
        </div>
        <div className="canvasTools">
          <span>View</span>
          <button type="button">Logical <ChevronDown size={14} /></button>
          <span>Environment</span>
          <button type="button">Production <ChevronDown size={14} /></button>
          <button className="squareTool" type="button" aria-label="Fit view"><Expand size={15} /></button>
          <button className="squareTool" type="button" aria-label="Search"><Search size={15} /></button>
          <button className="squareTool" type="button" aria-label="Lock"><LockKeyhole size={15} /></button>
        </div>
      </div>

      <div className="canvasViewport">
        <div className="canvasBoard">
          <svg className="canvasEdges" width="1040" height="760" viewBox="0 0 1040 760" aria-hidden="true">
            <path className="softEdge" d="M 156 372 C 260 372, 268 372, 372 372" />
            {providerNames.slice(0, 8).map((_, index) => (
              <path
                key={index}
                className="dashedEdge"
                d={`M 156 ${210 + index * 45} C 252 ${210 + index * 45}, 276 372, 372 372`}
              />
            ))}
            {topModules.map((_, index) => {
              const x = 302 + index * 166;
              return <path key={index} className="primaryEdge" d={`M ${x} 204 C ${x} 304, 430 302, 430 358`} />;
            })}
            <path className="primaryEdge" d="M 520 486 C 520 548, 520 560, 520 604" />
            <path className="primaryEdge" d="M 674 372 C 746 372, 756 372, 818 372" />
            <path className="softEdge" d="M 452 604 C 452 548, 452 530, 452 486" />
            <path className="softEdge" d="M 588 604 C 588 548, 588 530, 588 486" />
          </svg>

          <motion.article className="stackNode currentStackNode" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="nodeKicker">{input.mode === "launch" ? "Benchmark stack" : "Current stack"}</span>
            <small>{input.selectedProviderIds.length || input.vendorCount} providers</small>
            <div className="stackProviderList">
              {(providerNames.length ? providerNames : ["Circle Wallets", "Bridge", "BVNK", "Transak"]).map((name) => (
                <span key={name}><WalletCards size={14} />{name}</span>
              ))}
            </div>
          </motion.article>

          {topModules.map((module, index) => {
            const Icon = moduleIcons[module.id] ?? Boxes;
            const group = groups.find((item) => item.module.id === module.id);
            const providers = group?.providers.slice(0, 2) ?? module.providers.slice(0, 2);
            return (
              <motion.article
                key={module.id}
                className="stackNode moduleStackNode"
                style={{ left: 240 + index * 166 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Icon size={18} />
                <span>{shortModuleLabel(module.label)}</span>
                <small>{providers.length} providers</small>
                {providers.map((provider) => (
                  <b key={provider.id}>{provider.name}</b>
                ))}
              </motion.article>
            );
          })}

          <motion.article className="omsCoreNode" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="omsCoreTitle">
              <span className="miniMark" />
              <strong>Polygon OMS Orchestration</strong>
            </div>
            <div className="omsCoreGrid">
              <span><Crosshair size={15} />Policy & routing</span>
              <span><Database size={15} />Reconciliation</span>
              <span><WalletCards size={15} />Ledger & balances</span>
              <span><ShieldCheck size={15} />Risk & monitoring</span>
              <span><GitBranch size={15} />Counterparty mgmt</span>
              <span><Boxes size={15} />Workflow engine</span>
            </div>
          </motion.article>

          <motion.article className="controlsNode" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <span className="nodeKicker"><ShieldCheck size={15} /> Compliance controls</span>
            <div>
              {recommendation.compliance.slice(0, 6).map((control) => (
                <span key={control.id}>{control.label}</span>
              ))}
            </div>
          </motion.article>

          <motion.article className="outcomesNode" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
            <span className="nodeKicker"><ShieldCheck size={15} /> Outcomes</span>
            {["Faster settlement", "Lower fees", "Unified ledger", "Better compliance", "Scalable growth"].map((item) => (
              <p key={item}><CheckCircle2 size={16} />{item}</p>
            ))}
          </motion.article>

          <div className="canvasZoom">
            <button type="button"><Expand size={14} /></button>
            <span>−</span>
            <strong>100%</strong>
            <span>+</span>
            <button type="button"><LockKeyhole size={14} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

function shortModuleLabel(label: string) {
  return label
    .replace("Cash Ramps and On/Off-Ramp", "Cash Ramps")
    .replace("Cross-Border Payments", "Cross-Border Payments")
    .replace("Stablecoin Orchestration", "Stablecoin Orchestration")
    .replace("Wallet Infrastructure", "Wallet Infrastructure");
}
