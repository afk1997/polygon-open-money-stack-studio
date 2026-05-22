"use client";

import {
  Banknote,
  Boxes,
  Braces,
  Factory,
  GitBranch,
  Globe2,
  Landmark,
  Network,
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
  ramps: Globe2,
  "cross-border": GitBranch,
  "blockchain-integration": Braces,
  cdk: Boxes,
  "compliance-security": ShieldCheck,
};

const CANVAS_NODE_WIDTH = 230;

type CanvasNode = {
  id: string;
  title: string;
  label: string;
  body: string;
  chips: string[];
  kind: "source" | "oms" | "module" | "outcome";
  x: number;
  y: number;
  icon: ComponentType<{ size?: number }>;
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
  const nodes = buildCanvasNodes(input, recommendation, requiredModules);
  const edges = buildCanvasEdges(nodes);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <section className="canvasShell">
      <div className="canvasToolbar">
        <div>
          <span className="kicker">Canvas</span>
          <h2>{input.mode === "launch" ? "Launch blueprint" : "Migration map"}</h2>
        </div>
        <div className="canvasTools">
          <button type="button">Export PNG</button>
          <button type="button">Reset view</button>
        </div>
      </div>

      <div className="canvasViewport">
        <div className="canvasBoard">
          <svg className="canvasEdges" width="1100" height="1120" viewBox="0 0 1100 1120">
            {edges.map((edge) => {
              const source = nodesById.get(edge.source);
              const target = nodesById.get(edge.target);
              if (!source || !target) return null;
              const sx = source.x + CANVAS_NODE_WIDTH;
              const sy = source.y + 62;
              const tx = target.x;
              const ty = target.y + 62;
              const mid = sx + Math.max(70, (tx - sx) / 2);
              return (
                <motion.path
                  key={`${edge.source}-${edge.target}`}
                  d={`M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${tx} ${ty}`}
                  fill="none"
                  stroke="#8ea8df"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.45, delay: 0.08 }}
                />
              );
            })}
          </svg>

          {nodes.map((node, index) => {
            const Icon = node.icon;
            return (
              <motion.article
                key={node.id}
                className={`canvasNode ${node.kind}`}
                style={{ left: node.x, top: node.y }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
              >
                <div className="nodeMeta">
                  <span><Icon size={14} /> {node.label}</span>
                </div>
                <h3>{node.title}</h3>
                <p>{node.body}</p>
                <div className="nodeTags">
                  {node.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function buildCanvasNodes(
  input: StudioInput,
  recommendation: Recommendation,
  requiredModules: OMSModule[],
): CanvasNode[] {
  const selectedGroups = groupProvidersByModule(input.selectedProviderIds);
  const sourceTitle = input.mode === "launch" ? "Benchmark stack" : "Current stack";
  const sourceBody =
    input.mode === "launch"
      ? `${input.selectedProviderIds.length} point providers modeled from the selected use case and requirements.`
      : `${input.selectedProviderIds.length || input.vendorCount} providers, ${input.apiSurfaceCount} APIs, ${input.reconciliationFeeds} reconciliation feeds.`;

  const moduleNodes = requiredModules.slice(0, 6).map((module, index) => ({
    id: `module-${module.id}`,
    title: module.label,
    label: "OMS module",
    body: moduleCanvasBody(module),
    chips: module.providers.slice(0, 2).map((provider) => provider.name),
    kind: "module" as const,
    x: 570,
    y: 78 + index * 176,
    icon: moduleIcons[module.id] ?? Boxes,
  }));

  return [
    {
      id: "source",
      title: sourceTitle,
      label: input.mode === "launch" ? "Benchmark" : "Today",
      body: sourceBody,
      chips: selectedGroups.slice(0, 3).map((group) => group.module.label),
      kind: "source",
      x: 42,
      y: 340,
      icon: input.mode === "launch" ? Landmark : Factory,
    },
    {
      id: "oms",
      title: "Polygon OMS",
      label: "Orchestration",
      body: "Wallets, stablecoin settlement, ramps, compliance hooks, crosschain routing, and chain services under one integration layer.",
      chips: ["one integration", "stablecoin rails", "compliance hooks"],
      kind: "oms",
      x: 306,
      y: 78,
      icon: Boxes,
    },
    ...moduleNodes,
    {
      id: "outcome-cost",
      title: "Business case",
      label: "Outcome",
      body: `${formatMoney(recommendation.costModel.firstYearNetSavings)} modeled first-year impact with public pricing caveats attached.`,
      chips: ["savings", "pricing evidence"],
      kind: "outcome",
      x: 840,
      y: 170,
      icon: Banknote,
    },
    {
      id: "outcome-controls",
      title: "Controls",
      label: "Outcome",
      body: "KYC/KYB, sanctions, KYT, Travel Rule, velocity limits, audit logs, and incident response paths.",
      chips: ["risk", "audit", "policy"],
      kind: "outcome",
      x: 840,
      y: 410,
      icon: ShieldCheck,
    },
    {
      id: "outcome-packet",
      title: "PMM packet",
      label: "Outcome",
      body: "Executive memo, 6-slide pitch, battlecard, and source appendix for a product marketing interview artifact.",
      chips: ["memo", "battlecard", "sources"],
      kind: "outcome",
      x: 840,
      y: 650,
      icon: GitBranch,
    },
  ];
}

function moduleCanvasBody(module: OMSModule) {
  const copy: Record<string, string> = {
    "wallet-infra": "Wallet policy, delegated signing, account abstraction, and custody routing through one OMS layer.",
    crosschain: "Crosschain message, liquidity, and settlement routing without separate bridge integrations.",
    "stablecoin-orchestration": "Issue, hold, settle, reconcile, and route stablecoins across product and payout flows.",
    ramps: "Cash-in, cash-out, local methods, and payout partner orchestration.",
    "cross-border": "Stablecoin settlement with local fiat endpoints and corridor reconciliation.",
    "blockchain-integration": "RPC, indexing, webhooks, event monitoring, and chain-state integrations for the flow.",
    cdk: "A bespoke payments chain path with Polygon CDK and AggLayer-style interoperability.",
    "compliance-security": "Sanctions, KYT, velocity limits, audit trails, and incident controls around each flow.",
  };

  return copy[module.id] ?? module.polygonRole;
}

function buildCanvasEdges(nodes: CanvasNode[]) {
  const moduleIds = nodes.filter((node) => node.kind === "module").map((node) => node.id);
  return [
    { source: "source", target: "oms" },
    ...moduleIds.map((moduleId) => ({ source: "oms", target: moduleId })),
    { source: "oms", target: "outcome-cost" },
    { source: "oms", target: "outcome-controls" },
    { source: "oms", target: "outcome-packet" },
  ];
}
