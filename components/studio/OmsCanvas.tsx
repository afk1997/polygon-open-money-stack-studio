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
import { formatMoney } from "@/lib/engine";
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
  const selectedProviders = groups.flatMap((group) =>
    group.providers.map((provider) => ({ provider, module: group.module })),
  );
  const providerCount = recommendation.costModel.selectedProviderCount || input.selectedProviderIds.length || input.vendorCount;
  const displayProviders = selectedProviders.slice(0, 10);
  const hiddenProviderCount = Math.max(selectedProviders.length - displayProviders.length, 0);
  const moduleCards = buildModuleCards(requiredModules, groups, recommendation);
  const board = { width: 1120, height: 820 };
  const currentStackConnectorY = 390;
  const coreInputX = 436;
  const moduleConnectorY = 248;
  const moduleX = (index: number) => 300 + index * 166;
  const topOutcomes = buildOutcomes(input, recommendation);

  return (
    <section className="canvasShell">
      <div className="canvasToolbar">
        <div className="canvasCrumb">
          <span className="miniMark" />
          <strong>Polygon OMS</strong>
          <em>Draft</em>
          <small>{providerCount} provider inputs priced</small>
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
          <svg className="canvasEdges" width={board.width} height={board.height} viewBox={`0 0 ${board.width} ${board.height}`} aria-hidden="true">
            <path className="softEdge" d={`M 206 ${currentStackConnectorY} C 300 ${currentStackConnectorY}, 334 ${currentStackConnectorY}, ${coreInputX} ${currentStackConnectorY}`} />
            {displayProviders.slice(0, 8).map((_, index) => {
              const y = 212 + index * 46;
              return (
              <path
                key={index}
                className="dashedEdge"
                d={`M 206 ${y} C 296 ${y}, 334 ${currentStackConnectorY}, ${coreInputX} ${currentStackConnectorY}`}
              />
              );
            })}
            {moduleCards.map((_, index) => {
              const x = moduleX(index) + 76;
              return <path key={index} className="primaryEdge" d={`M ${x} ${moduleConnectorY} C ${x} 326, 526 320, 526 374`} />;
            })}
            <path className="primaryEdge" d="M 596 518 C 596 582, 596 596, 596 640" />
            <path className="primaryEdge" d="M 772 410 C 844 410, 854 410, 916 410" />
            <path className="softEdge" d="M 510 640 C 510 582, 510 558, 510 518" />
            <path className="softEdge" d="M 682 640 C 682 582, 682 558, 682 518" />
          </svg>

          <motion.article className="stackNode currentStackNode" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="nodeKicker">{input.mode === "launch" ? "Benchmark stack" : "Current stack"}</span>
            <small>{providerCount} providers</small>
            <div className="stackProviderList">
              {displayProviders.map(({ provider, module }) => {
                const Icon = moduleIcons[module.id] ?? WalletCards;
                return (
                  <span key={provider.id}><Icon size={14} />{provider.name}</span>
                );
              })}
              {hiddenProviderCount > 0 && (
                <span className="stackMore">+ {hiddenProviderCount} more selected</span>
              )}
              {displayProviders.length === 0 && (
                <span className="stackEmpty">No point providers selected</span>
              )}
            </div>
          </motion.article>

          {moduleCards.map(({ module, providers, annualCost }, index) => {
            const Icon = moduleIcons[module.id] ?? Boxes;
            return (
              <motion.article
                key={module.id}
                className="stackNode moduleStackNode"
                style={{ left: moduleX(index) }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Icon size={18} />
                <span>{shortModuleLabel(module.label)}</span>
                <small>{providers.length} {providers.length === 1 ? "provider" : "providers"}{annualCost > 0 ? ` · ${formatMoney(annualCost)}/yr` : ""}</small>
                {providers.slice(0, 2).map((provider) => (
                  <b key={provider.id}>{provider.name}</b>
                ))}
                {providers.length === 0 && (
                  <b className="modulePlaceholder">OMS module planned</b>
                )}
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
            {topOutcomes.map((item) => (
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

function buildModuleCards(
  requiredModules: OMSModule[],
  groups: ReturnType<typeof groupProvidersByModule>,
  recommendation: Recommendation,
) {
  const byId = new Map<string, { module: OMSModule; providers: OMSModule["providers"]; annualCost: number }>();
  const moduleCost = new Map<string, number>();

  for (const line of recommendation.costModel.providerCostLines) {
    moduleCost.set(line.moduleId, (moduleCost.get(line.moduleId) ?? 0) + line.annualCost);
  }

  for (const module of requiredModules) {
    byId.set(module.id, { module, providers: [], annualCost: moduleCost.get(module.id) ?? 0 });
  }

  for (const group of groups) {
    byId.set(group.module.id, {
      module: group.module,
      providers: group.providers,
      annualCost: moduleCost.get(group.module.id) ?? 0,
    });
  }

  return Array.from(byId.values())
    .sort((a, b) => {
      const priorityDelta = modulePriority(a.module.id) - modulePriority(b.module.id);
      if (priorityDelta !== 0) return priorityDelta;
      return b.providers.length - a.providers.length;
    })
    .slice(0, 4);
}

function modulePriority(moduleId: string) {
  const order = [
    "wallet-infra",
    "stablecoin-orchestration",
    "ramps",
    "cross-border",
    "crosschain",
    "blockchain-integration",
    "cdk",
    "compliance-security",
  ];
  const index = order.indexOf(moduleId);
  return index === -1 ? order.length : index;
}

function buildOutcomes(input: StudioInput, recommendation: Recommendation) {
  const cost = recommendation.costModel;
  const settlementText =
    input.settlementDays > 1
      ? `${input.settlementDays}-day settlement drag modeled`
      : "Same-day settlement target";
  return [
    settlementText,
    `${formatMoney(cost.feeDelta)} fee delta`,
    `${cost.integrationComplexityReduction}% complexity reduction`,
    `${input.reconciliationFeeds} reconciliation feeds unified`,
    input.corridors ? `${compactCorridors(input.corridors)} corridors` : "Selected corridors covered",
  ];
}

function compactCorridors(corridors: string) {
  const parts = corridors
    .split(/,|→|->| to /i)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length <= 3) return corridors;
  return `${parts.slice(0, 3).join(", ")} +${parts.length - 3}`;
}

function shortModuleLabel(label: string) {
  return label
    .replace("Cash Ramps and On/Off-Ramp", "Cash Ramps")
    .replace("Cross-Border Payments", "Cross-Border Payments")
    .replace("Stablecoin Orchestration", "Stablecoin Orchestration")
    .replace("Wallet Infrastructure", "Wallet Infrastructure");
}
