"use client";

import "@xyflow/react/dist/style.css";

import {
  ArrowRight,
  Banknote,
  BookOpen,
  Boxes,
  Braces,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Factory,
  GitBranch,
  Globe2,
  Layers3,
  LockKeyhole,
  Network,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useMemo, useState } from "react";
import { modules, pricing, templates } from "@/lib/data";
import {
  buildExportPitch,
  defaultInput,
  formatMoney,
  generateRecommendation,
  normalizeInput,
} from "@/lib/engine";
import type { OMSModule, StudioInput, StudioMode } from "@/lib/types";

type RightTab = "economics" | "competitors" | "controls" | "export";

const moduleIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  "wallet-infra": WalletCards,
  crosschain: Network,
  "stablecoin-orchestration": Banknote,
  ramps: Globe2,
  "cross-border": GitBranch,
  "blockchain-integration": Braces,
  cdk: Layers3,
  "compliance-security": ShieldCheck,
};

const panelMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22 },
};

export function Studio() {
  const [input, setInput] = useState<StudioInput>(normalizeInput(defaultInput));
  const [activeTab, setActiveTab] = useState<RightTab>("economics");
  const [activeModuleId, setActiveModuleId] = useState("wallet-infra");
  const [exportedPitch, setExportedPitch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const recommendation = useMemo(() => generateRecommendation(input), [input]);
  const activeModule = modules.find((module) => module.id === activeModuleId) ?? modules[0];
  const useCase = templates.find((template) => template.id === input.useCaseId) ?? templates[0];
  const flow = useMemo(() => toFlowElements(recommendation), [recommendation]);

  function patchInput(patch: Partial<StudioInput>) {
    setInput((current) => normalizeInput({ ...current, ...patch }));
  }

  function setMode(mode: StudioMode) {
    patchInput({
      mode,
      vendorCount: mode === "launch" ? 8 : 11,
      apiSurfaceCount: mode === "launch" ? 12 : 18,
      reconciliationFeeds: mode === "launch" ? 3 : 6,
      complianceHandoffs: mode === "launch" ? 3 : 4,
      settlementDays: mode === "launch" ? 2 : 3,
    });
  }

  function setUseCase(useCaseId: string) {
    const selected = templates.find((template) => template.id === useCaseId) ?? templates[0];
    patchInput({
      useCaseId,
      monthlyVolume: selected.defaultVolume,
      monthlyTransactions: selected.defaultTransactions,
      activeWallets: selected.defaultWallets,
      corridors: selected.defaultCorridors,
    });
  }

  function toggleProvider(providerId: string) {
    setInput((current) => {
      const selected = new Set(current.selectedProviderIds);
      if (selected.has(providerId)) selected.delete(providerId);
      else selected.add(providerId);
      return normalizeInput({ ...current, selectedProviderIds: Array.from(selected) });
    });
  }

  async function exportPitch() {
    setIsExporting(true);
    setActiveTab("export");
    try {
      const response = await fetch("/api/export-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as { markdown?: string };
      setExportedPitch(payload.markdown ?? buildExportPitch(input));
    } catch {
      setExportedPitch(buildExportPitch(input));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="studio">
      <div className="noise" aria-hidden="true" />
      <header className="topbar">
        <div className="brandLockup">
          <div className="brandMark">
            <Boxes size={19} />
          </div>
          <div>
            <p className="eyebrow">Polygon Open Money Stack</p>
            <h1>OMS Studio</h1>
          </div>
        </div>
        <div className="topbarMeta">
          <span>Public-price evidence</span>
          <span>Migration lab</span>
          <span>PMM export</span>
        </div>
      </header>

      <section className="workspace">
        <aside className="leftPanel panel">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Scenario Builder</p>
              <h2>{input.mode === "launch" ? "Launch New" : "Modernize Existing"}</h2>
            </div>
            <SlidersHorizontal size={18} />
          </div>

          <div className="modeSwitch" role="group" aria-label="Studio mode">
            <button
              className={input.mode === "launch" ? "active" : ""}
              type="button"
              onClick={() => setMode("launch")}
            >
              <Sparkles size={16} />
              Launch New
            </button>
            <button
              className={input.mode === "migration" ? "active" : ""}
              type="button"
              onClick={() => setMode("migration")}
            >
              <Factory size={16} />
              Modernize
            </button>
          </div>

          <label className="field">
            <span>Product archetype</span>
            <select value={input.useCaseId} onChange={(event) => setUseCase(event.target.value)}>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <small>{useCase.headline}</small>
          </label>

          <div className="metricInputs">
            <NumberField
              label="Monthly volume"
              value={input.monthlyVolume}
              min={500000}
              step={500000}
              prefix="$"
              onChange={(monthlyVolume) => patchInput({ monthlyVolume })}
            />
            <NumberField
              label="Monthly transactions"
              value={input.monthlyTransactions}
              min={1000}
              step={1000}
              onChange={(monthlyTransactions) => patchInput({ monthlyTransactions })}
            />
            <NumberField
              label="Active wallets"
              value={input.activeWallets}
              min={1000}
              step={1000}
              onChange={(activeWallets) => patchInput({ activeWallets })}
            />
            <NumberField
              label="Settlement delay"
              value={input.settlementDays}
              min={0}
              step={0.25}
              suffix=" days"
              onChange={(settlementDays) => patchInput({ settlementDays })}
            />
          </div>

          <label className="field">
            <span>Corridors</span>
            <textarea
              value={input.corridors}
              onChange={(event) => patchInput({ corridors: event.target.value })}
            />
          </label>

          <div className="stackControls">
            <div className="miniGrid">
              <NumberField
                label={input.mode === "launch" ? "Vendors avoided" : "Current vendors"}
                value={input.vendorCount}
                min={1}
                step={1}
                onChange={(vendorCount) => patchInput({ vendorCount })}
              />
              <NumberField
                label="API surfaces"
                value={input.apiSurfaceCount}
                min={1}
                step={1}
                onChange={(apiSurfaceCount) => patchInput({ apiSurfaceCount })}
              />
              <NumberField
                label="Recon feeds"
                value={input.reconciliationFeeds}
                min={1}
                step={1}
                onChange={(reconciliationFeeds) => patchInput({ reconciliationFeeds })}
              />
              <NumberField
                label="Compliance handoffs"
                value={input.complianceHandoffs}
                min={1}
                step={1}
                onChange={(complianceHandoffs) => patchInput({ complianceHandoffs })}
              />
            </div>
          </div>

          <div className="modulePicker">
            <div className="sectionTitle">
              <span>Point-solution market</span>
              <ChevronDown size={15} />
            </div>
            <div className="moduleChips">
              {modules.map((module) => {
                const Icon = moduleIcons[module.id] ?? Boxes;
                return (
                  <button
                    key={module.id}
                    className={module.id === activeModuleId ? "selected" : ""}
                    type="button"
                    onClick={() => setActiveModuleId(module.id)}
                  >
                    <Icon size={14} />
                    {module.label.replace("Blockchain-as-a-service ", "BaaS ")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="providerList">
            {activeModule.providers.slice(0, 9).map((provider) => (
              <button
                key={provider.id}
                className={input.selectedProviderIds.includes(provider.id) ? "checked" : ""}
                type="button"
                onClick={() => toggleProvider(provider.id)}
              >
                <span>{provider.name}</span>
                <CheckCircle2 size={15} />
              </button>
            ))}
          </div>
        </aside>

        <section className="canvasColumn">
          <motion.div className="heroStrip" layout>
            <div>
              <p className="eyebrow">Generated Pitch</p>
              <h2>{recommendation.title}</h2>
              <p>{recommendation.narrative}</p>
            </div>
            <button className="primaryButton" type="button" onClick={exportPitch}>
              <Download size={17} />
              Export brief
            </button>
          </motion.div>

          <div className="depthMoment">
            <div className="depthIcon">
              <LockKeyhole size={18} />
            </div>
            <p>{recommendation.depthMoment}</p>
          </div>

          <div className="canvasShell">
            <div className="canvasHeader">
              <div>
                <p className="eyebrow">Architecture Canvas</p>
                <h3>Before, controls, OMS core, and outcomes</h3>
              </div>
              <div className="canvasLegend">
                <span className="current">Current</span>
                <span className="oms">OMS</span>
                <span className="control">Control</span>
              </div>
            </div>
            <div className="flowWrap">
              <ReactFlow
                nodes={flow.nodes}
                edges={flow.edges}
                fitView
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                nodesConnectable={false}
              >
                <Background color="#d9ded9" gap={22} />
                <MiniMap zoomable pannable />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </div>

          <div className="moduleRunway">
            {recommendation.modules.map((module, index) => {
              const Icon = moduleIcons[module.id] ?? Boxes;
              return (
                <motion.div
                  key={module.id}
                  className="moduleTile"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.045 }}
                >
                  <Icon size={18} />
                  <span>{module.label}</span>
                </motion.div>
              );
            })}
          </div>
        </section>

        <aside className="rightPanel panel">
          <div className="tabBar">
            <TabButton active={activeTab === "economics"} onClick={() => setActiveTab("economics")}>
              <Banknote size={15} />
              Economics
            </TabButton>
            <TabButton active={activeTab === "competitors"} onClick={() => setActiveTab("competitors")}>
              <BookOpen size={15} />
              Competitors
            </TabButton>
            <TabButton active={activeTab === "controls"} onClick={() => setActiveTab("controls")}>
              <ShieldCheck size={15} />
              Controls
            </TabButton>
            <TabButton active={activeTab === "export"} onClick={() => setActiveTab("export")}>
              <ClipboardList size={15} />
              Export
            </TabButton>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "economics" && (
              <motion.div key="economics" {...panelMotion} className="tabPanel">
                <div className="savingsHero">
                  <p>First-year net savings</p>
                  <strong>{formatMoney(recommendation.costModel.firstYearNetSavings)}</strong>
                  <span>
                    Range {formatMoney(recommendation.costModel.lowCaseSavings)} to{" "}
                    {formatMoney(recommendation.costModel.highCaseSavings)}
                  </span>
                </div>
                <MetricRow
                  label="Current annual stack"
                  value={formatMoney(recommendation.costModel.currentAnnualCost)}
                />
                <MetricRow
                  label="Modeled OMS stack"
                  value={formatMoney(recommendation.costModel.modeledOmsAnnualCost)}
                />
                <MetricRow
                  label="Steady-state annual savings"
                  value={formatMoney(recommendation.costModel.steadyStateAnnualSavings)}
                />
                <MetricRow
                  label="Integration complexity reduction"
                  value={`${recommendation.costModel.integrationComplexityReduction}%`}
                />
                <div className="waterfall">
                  <WaterfallBar
                    label="Fee delta"
                    value={recommendation.costModel.feeDelta}
                    max={recommendation.costModel.steadyStateAnnualSavings}
                  />
                  <WaterfallBar
                    label="Vendor consolidation"
                    value={recommendation.costModel.fixedVendorSavings}
                    max={recommendation.costModel.steadyStateAnnualSavings}
                  />
                  <WaterfallBar
                    label="Liquidity release"
                    value={recommendation.costModel.workingCapitalRelease}
                    max={recommendation.costModel.steadyStateAnnualSavings}
                  />
                </div>
                <div className="assumptionBox">
                  {recommendation.costModel.assumptions.map((assumption) => (
                    <p key={assumption}>{assumption}</p>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "competitors" && (
              <motion.div key="competitors" {...panelMotion} className="tabPanel">
                <div className="sourceHeader">
                  <div>
                    <p className="eyebrow">Research Coverage</p>
                    <h3>{activeModule.label}</h3>
                  </div>
                  <span>{activeModule.providers.length} providers</span>
                </div>
                <p className="moduleRole">{activeModule.polygonRole}</p>
                <div className="competitorRows">
                  {activeModule.providers.map((provider) => {
                    const evidence = pricing.find((item) => item.providerId === provider.id);
                    return (
                      <article key={provider.id} className="competitorRow">
                        <div>
                          <strong>{provider.name}</strong>
                          <span>{provider.category}</span>
                        </div>
                        <p>{provider.pricingSignal}</p>
                        <small>{provider.strength}</small>
                        {evidence && (
                          <a href={evidence.url} target="_blank" rel="noreferrer">
                            Source <ArrowRight size={13} />
                          </a>
                        )}
                      </article>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "controls" && (
              <motion.div key="controls" {...panelMotion} className="tabPanel">
                <div className="sourceHeader">
                  <div>
                    <p className="eyebrow">Compliance Map</p>
                    <h3>Secure, compliant money movement</h3>
                  </div>
                  <ShieldCheck size={18} />
                </div>
                <div className="controlTimeline">
                  {recommendation.compliance.map((control, index) => (
                    <div key={control.id} className="controlStep">
                      <span>{index + 1}</span>
                      <div>
                        <strong>{control.label}</strong>
                        <small>{control.phase}</small>
                        <p>{control.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="playbook">
                  <h3>{recommendation.playbook.name}</h3>
                  <div className="playbookGrid">
                    <PlaybookList label="Retain" items={recommendation.playbook.retained} />
                    <PlaybookList label="Replace" items={recommendation.playbook.replaced} />
                    <PlaybookList label="Wrap" items={recommendation.playbook.wrapped} />
                  </div>
                  <ol>
                    {recommendation.playbook.phases.map((phase) => (
                      <li key={phase}>{phase}</li>
                    ))}
                  </ol>
                </div>
              </motion.div>
            )}

            {activeTab === "export" && (
              <motion.div key="export" {...panelMotion} className="tabPanel">
                <div className="sourceHeader">
                  <div>
                    <p className="eyebrow">PMM Packet</p>
                    <h3>Pitch-ready narrative</h3>
                  </div>
                  <button className="iconButton" type="button" onClick={exportPitch}>
                    <RefreshCcw size={16} />
                  </button>
                </div>
                <textarea
                  className="exportBox"
                  value={exportedPitch || buildExportPitch(input)}
                  onChange={(event) => setExportedPitch(event.target.value)}
                />
                <button className="primaryButton wide" type="button" onClick={exportPitch}>
                  <Download size={17} />
                  {isExporting ? "Preparing brief" : "Regenerate from API"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </section>
    </main>
  );
}

function NumberField({
  label,
  value,
  min,
  step,
  prefix = "",
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  step: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="numberField">
      <span>{label}</span>
      <input
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <small>
        {prefix}
        {Number(value).toLocaleString()}
        {suffix}
      </small>
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={active ? "active" : ""} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="metricRow">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WaterfallBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(6, Math.min(100, (value / Math.max(max, 1)) * 100));
  return (
    <div className="waterfallBar">
      <div>
        <span>{label}</span>
        <strong>{formatMoney(value)}</strong>
      </div>
      <i style={{ width: `${width}%` }} />
    </div>
  );
}

function PlaybookList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <strong>{label}</strong>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function toFlowElements(recommendation: ReturnType<typeof generateRecommendation>) {
  const groupY: Record<string, number> = {
    current: 10,
    control: 230,
    oms: 120,
    outcome: 330,
  };
  const groupX: Record<string, number> = {
    current: 0,
    control: 290,
    oms: 560,
    outcome: 860,
  };
  const counters: Record<string, number> = {};

  const nodes: Node[] = recommendation.architecture.nodes.map((node) => {
    counters[node.group] = (counters[node.group] ?? 0) + 1;
    const Icon = node.group === "control" ? ShieldCheck : node.group === "outcome" ? Globe2 : Boxes;
    return {
      id: node.id,
      position: {
        x: groupX[node.group] + ((counters[node.group] - 1) % 2) * 210,
        y: groupY[node.group] + Math.floor((counters[node.group] - 1) / 2) * 104,
      },
      data: {
        label: (
          <div className={`flowNode ${node.group}`}>
            <Icon size={15} />
            <strong>{node.label}</strong>
            <span>{node.detail}</span>
          </div>
        ),
      },
      className: "flowNodeShell",
      type: "default",
    };
  });

  const edges: Edge[] = recommendation.architecture.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: edge.source === "oms-core",
    style: { stroke: edge.source === "oms-core" ? "#365c50" : "#aab2ad", strokeWidth: 1.4 },
    labelStyle: { fill: "#4c5751", fontSize: 11, fontWeight: 600 },
  }));

  return { nodes, edges };
}
