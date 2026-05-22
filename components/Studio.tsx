"use client";

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
  FileText,
  GitBranch,
  Globe2,
  Landmark,
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
import type React from "react";
import { useMemo, useState } from "react";
import { modules, pricing, templates } from "@/lib/data";
import {
  buildExportPitch,
  defaultInput,
  formatMoney,
  generateRecommendation,
  normalizeInput,
} from "@/lib/engine";
import type { OMSModule, Provider, Recommendation, StudioInput, StudioMode } from "@/lib/types";

type InsightTab = "evidence" | "controls" | "packet";
type PacketTab = "memo" | "slides" | "battlecard" | "sources";

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
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18 },
};

export function Studio() {
  const [input, setInput] = useState<StudioInput>(normalizeInput(defaultInput));
  const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id ?? "wallet-infra");
  const [activeTab, setActiveTab] = useState<InsightTab>("evidence");
  const [packetTab, setPacketTab] = useState<PacketTab>("memo");
  const [exportedPitch, setExportedPitch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [generatedLabel, setGeneratedLabel] = useState("Ready");

  const recommendation = useMemo(() => generateRecommendation(input), [input]);
  const useCase = templates.find((template) => template.id === input.useCaseId) ?? templates[0]!;
  const activeModule =
    modules.find((module) => module.id === activeModuleId) ??
    recommendation.modules[0] ??
    modules[0]!;
  const packet = useMemo(
    () => buildPacketSections(input, recommendation, activeModule),
    [input, recommendation, activeModule],
  );

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
    const selected = templates.find((template) => template.id === useCaseId) ?? templates[0]!;
    patchInput({
      useCaseId,
      monthlyVolume: selected.defaultVolume,
      monthlyTransactions: selected.defaultTransactions,
      activeWallets: selected.defaultWallets,
      corridors: selected.defaultCorridors,
    });
    setActiveModuleId(selected.requiredModules[0] ?? "wallet-infra");
  }

  function toggleProvider(providerId: string) {
    setInput((current) => {
      const selected = new Set(current.selectedProviderIds);
      if (selected.has(providerId)) selected.delete(providerId);
      else selected.add(providerId);
      return normalizeInput({ ...current, selectedProviderIds: Array.from(selected) });
    });
  }

  function generateStrategy() {
    setGeneratedLabel(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setActiveTab("evidence");
  }

  async function generatePacket() {
    setIsExporting(true);
    setActiveTab("packet");
    setPacketTab("memo");
    try {
      const response = await fetch("/api/export-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as { markdown?: string };
      setExportedPitch(payload.markdown ?? packet.markdown);
    } catch {
      setExportedPitch(packet.markdown);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="lab">
      <div className="gridBackdrop" aria-hidden="true" />
      <header className="labTopbar">
        <div className="brandLockup">
          <div className="brandMark">
            <Boxes size={18} />
          </div>
          <div>
            <p className="eyebrow">Polygon Open Money Stack</p>
            <h1>OMS Migration Lab</h1>
          </div>
        </div>
        <div className="topbarMeta" aria-label="Studio capabilities">
          <span>Stack autopsy</span>
          <span>Competitor evidence</span>
          <span>PMM packet</span>
        </div>
        <button className="topbarAction" type="button" onClick={generatePacket}>
          <ClipboardList size={16} />
          Generate PMM Packet
        </button>
      </header>

      <section className="labWorkspace">
        <CommandPanel
          input={input}
          useCaseHeadline={useCase.headline}
          activeModule={activeModule}
          onModeChange={setMode}
          onUseCaseChange={setUseCase}
          onPatchInput={patchInput}
          onModuleChange={(moduleId) => {
            setActiveModuleId(moduleId);
            setActiveTab("evidence");
          }}
          onProviderToggle={toggleProvider}
        />

        <section className="artifactColumn" aria-label="Generated OMS strategy">
          <ExecutiveStrip
            recommendation={recommendation}
            generatedLabel={generatedLabel}
            onGenerate={generateStrategy}
          />
          <MigrationMap
            input={input}
            recommendation={recommendation}
            activeModuleId={activeModule.id}
            onModuleClick={(moduleId) => {
              setActiveModuleId(moduleId);
              setActiveTab("evidence");
            }}
          />
          <InsightPanel
            input={input}
            recommendation={recommendation}
            activeModule={activeModule}
            activeTab={activeTab}
            packetTab={packetTab}
            exportedPitch={exportedPitch}
            packet={packet}
            isExporting={isExporting}
            onTabChange={setActiveTab}
            onPacketTabChange={setPacketTab}
            onGeneratePacket={generatePacket}
          />
        </section>

        <BusinessCasePanel
          input={input}
          recommendation={recommendation}
          isExporting={isExporting}
          onGenerateStrategy={generateStrategy}
          onGeneratePacket={generatePacket}
        />
      </section>
    </main>
  );
}

function CommandPanel({
  input,
  useCaseHeadline,
  activeModule,
  onModeChange,
  onUseCaseChange,
  onPatchInput,
  onModuleChange,
  onProviderToggle,
}: {
  input: StudioInput;
  useCaseHeadline: string;
  activeModule: OMSModule;
  onModeChange: (mode: StudioMode) => void;
  onUseCaseChange: (useCaseId: string) => void;
  onPatchInput: (patch: Partial<StudioInput>) => void;
  onModuleChange: (moduleId: string) => void;
  onProviderToggle: (providerId: string) => void;
}) {
  return (
    <aside className="commandPanel panel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Command panel</p>
          <h2>{input.mode === "launch" ? "Launch New" : "Modernize Existing"}</h2>
        </div>
        <SlidersHorizontal size={18} />
      </div>

      <div className="modeSwitch" role="group" aria-label="Studio mode">
        <button
          className={input.mode === "launch" ? "active" : ""}
          type="button"
          onClick={() => onModeChange("launch")}
        >
          <Sparkles size={15} />
          Launch New
        </button>
        <button
          className={input.mode === "migration" ? "active" : ""}
          type="button"
          onClick={() => onModeChange("migration")}
        >
          <Factory size={15} />
          Modernize
        </button>
      </div>

      <label className="field">
        <span>Product archetype</span>
        <select
          suppressHydrationWarning
          value={input.useCaseId}
          onChange={(event) => onUseCaseChange(event.target.value)}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <small>{useCaseHeadline}</small>
      </label>

      <div className="primaryInputs">
        <NumberField
          label="Monthly volume"
          value={input.monthlyVolume}
          min={500000}
          step={500000}
          prefix="$"
          onChange={(monthlyVolume) => onPatchInput({ monthlyVolume })}
        />
        <NumberField
          label="Transactions"
          value={input.monthlyTransactions}
          min={1000}
          step={1000}
          onChange={(monthlyTransactions) => onPatchInput({ monthlyTransactions })}
        />
      </div>

      <label className="field compact">
        <span>Corridors</span>
        <textarea
          suppressHydrationWarning
          value={input.corridors}
          onChange={(event) => onPatchInput({ corridors: event.target.value })}
        />
      </label>

      <details className="advancedDrawer">
        <summary>
          <span>Advanced stack assumptions</span>
          <ChevronDown size={15} />
        </summary>
        <div className="stackInputs">
          <NumberField
            label={input.mode === "launch" ? "Vendors avoided" : "Current vendors"}
            value={input.vendorCount}
            min={1}
            step={1}
            onChange={(vendorCount) => onPatchInput({ vendorCount })}
          />
          <NumberField
            label="API surfaces"
            value={input.apiSurfaceCount}
            min={1}
            step={1}
            onChange={(apiSurfaceCount) => onPatchInput({ apiSurfaceCount })}
          />
          <NumberField
            label="Recon feeds"
            value={input.reconciliationFeeds}
            min={1}
            step={1}
            onChange={(reconciliationFeeds) => onPatchInput({ reconciliationFeeds })}
          />
          <NumberField
            label="Compliance handoffs"
            value={input.complianceHandoffs}
            min={1}
            step={1}
            onChange={(complianceHandoffs) => onPatchInput({ complianceHandoffs })}
          />
          <NumberField
            label="Active wallets"
            value={input.activeWallets}
            min={1000}
            step={1000}
            onChange={(activeWallets) => onPatchInput({ activeWallets })}
          />
          <NumberField
            label="Settlement delay"
            value={input.settlementDays}
            min={0}
            step={0.25}
            suffix=" days"
            onChange={(settlementDays) => onPatchInput({ settlementDays })}
          />
        </div>
      </details>

      <details className="marketDrawer">
        <summary>
          <span>Point-solution market</span>
          <ChevronDown size={15} />
        </summary>
        <div className="moduleChips">
          {modules.map((module) => {
            const Icon = moduleIcons[module.id] ?? Boxes;
            return (
              <button
                key={module.id}
                className={module.id === activeModule.id ? "selected" : ""}
                type="button"
                onClick={() => onModuleChange(module.id)}
              >
                <Icon size={14} />
                {shortModuleLabel(module.label)}
              </button>
            );
          })}
        </div>
        <div className="selectedStackNote">
          <strong>{input.selectedProviderIds.length} providers modeled</strong>
          <span>Selected vendors now drive the current-stack cost calculation.</span>
        </div>
        <div className="providerList">
          {activeModule.providers.slice(0, 7).map((provider) => (
            <button
              key={provider.id}
              className={input.selectedProviderIds.includes(provider.id) ? "checked" : ""}
              type="button"
              onClick={() => onProviderToggle(provider.id)}
            >
              <span>{provider.name}</span>
              <CheckCircle2 size={15} />
            </button>
          ))}
        </div>
      </details>
    </aside>
  );
}

function ExecutiveStrip({
  recommendation,
  generatedLabel,
  onGenerate,
}: {
  recommendation: Recommendation;
  generatedLabel: string;
  onGenerate: () => void;
}) {
  return (
    <section className="executiveStrip panel">
      <div className="strategyCopy">
        <div className="statusLine">
          <span className="liveDot" />
          <span>Strategy status: {generatedLabel}</span>
        </div>
        <h2>{recommendation.title}</h2>
        <p>{recommendation.narrative}</p>
      </div>
      <button className="primaryAction" type="button" onClick={onGenerate}>
        <Sparkles size={17} />
        Generate OMS Strategy
      </button>
      <div className="depthCallout">
        <LockKeyhole size={17} />
        <p>{recommendation.depthMoment}</p>
      </div>
    </section>
  );
}

function MigrationMap({
  input,
  recommendation,
  activeModuleId,
  onModuleClick,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  activeModuleId: string;
  onModuleClick: (moduleId: string) => void;
}) {
  const modeledProviderCount =
    recommendation.costModel.selectedProviderCount || input.vendorCount;
  const currentCards =
    input.mode === "migration"
      ? [
          {
            title: `${modeledProviderCount} providers modeled`,
            detail: `${input.apiSurfaceCount} APIs, ${input.reconciliationFeeds} recon feeds`,
          },
          {
            title: "Legacy settlement",
            detail: `${input.settlementDays} day liquidity drag across ${input.corridors}`,
          },
          {
            title: "Compliance handoffs",
            detail: `${input.complianceHandoffs} control boundaries before payout`,
          },
        ]
      : [
          {
            title: "New product surface",
            detail: "Customer UX, policy model, corridors, and launch constraints.",
          },
          {
            title: `${modeledProviderCount} providers avoided`,
            detail: "Wallets, ramps, chain infra, settlement, and risk discovery.",
          },
          {
            title: "Launch liquidity path",
            detail: input.corridors,
          },
        ];

  const retainedCards = [
    ...recommendation.playbook.retained.slice(0, 2),
    ...recommendation.playbook.wrapped.slice(0, 2),
  ].slice(0, 4);

  const outcomeCards = [
    {
      title: "One orchestration layer",
      detail: "Wallets, ramps, stablecoin settlement, chain services, and compliance hooks.",
    },
    {
      title: "Treasury and recon events",
      detail: `${formatMoney(recommendation.costModel.steadyStateAnnualSavings)} steady-state modeled savings.`,
    },
    {
      title: "PMM-ready proof",
      detail: "Battlecards, caveats, source evidence, and launch narrative.",
    },
  ];

  return (
    <section className="migrationMap panel">
      <div className="mapHeader">
        <div>
          <p className="eyebrow">Migration canvas</p>
          <h3>Before stack, OMS core, retained partners, outcomes</h3>
        </div>
        <div className="routeLegend">
          <span className="current">Current</span>
          <span className="oms">Polygon OMS</span>
          <span className="partner">Retained</span>
          <span className="outcome">Outcome</span>
        </div>
      </div>

      <div className="routeSpine" aria-hidden="true">
        <span>Assess</span>
        <i />
        <span>Orchestrate</span>
        <i />
        <span>Settle</span>
      </div>

      <div className="mapLanes">
        <MapLane title="Current Stack" tone="current" kicker={input.mode === "launch" ? "Starting point" : "Fragmented today"}>
          {currentCards.map((card) => (
            <MapCard key={card.title} title={card.title} detail={card.detail} tone="current" />
          ))}
        </MapLane>

        <MapLane title="Polygon OMS" tone="oms" kicker="One integration">
          {recommendation.modules.map((module) => {
            const Icon = moduleIcons[module.id] ?? Boxes;
            return (
              <button
                key={module.id}
                className={`mapCard moduleCard oms ${module.id === activeModuleId ? "active" : ""}`}
                type="button"
                onClick={() => onModuleClick(module.id)}
              >
                <Icon size={16} />
                <strong>{shortModuleLabel(module.label)}</strong>
                <span>{module.polygonRole}</span>
              </button>
            );
          })}
        </MapLane>

        <MapLane title="Retained Partners" tone="partner" kicker="Compliant by design">
          {retainedCards.map((item) => (
            <MapCard key={item} title={item} detail="Kept, wrapped, or phased with policy and audit controls." tone="partner" />
          ))}
        </MapLane>

        <MapLane title="Outcomes" tone="outcome" kicker="PMM proof">
          {outcomeCards.map((card) => (
            <MapCard key={card.title} title={card.title} detail={card.detail} tone="outcome" />
          ))}
        </MapLane>
      </div>
    </section>
  );
}

function InsightPanel({
  input,
  recommendation,
  activeModule,
  activeTab,
  packetTab,
  exportedPitch,
  packet,
  isExporting,
  onTabChange,
  onPacketTabChange,
  onGeneratePacket,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  activeModule: OMSModule;
  activeTab: InsightTab;
  packetTab: PacketTab;
  exportedPitch: string;
  packet: PacketSections;
  isExporting: boolean;
  onTabChange: (tab: InsightTab) => void;
  onPacketTabChange: (tab: PacketTab) => void;
  onGeneratePacket: () => void;
}) {
  return (
    <section className="insightPanel panel">
      <div className="sectionTabs">
        <TabButton active={activeTab === "evidence"} onClick={() => onTabChange("evidence")}>
          <BookOpen size={15} />
          Evidence
        </TabButton>
        <TabButton active={activeTab === "controls"} onClick={() => onTabChange("controls")}>
          <ShieldCheck size={15} />
          Controls
        </TabButton>
        <TabButton active={activeTab === "packet"} onClick={() => onTabChange("packet")}>
          <FileText size={15} />
          PMM Packet
        </TabButton>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "evidence" && (
          <motion.div key="evidence" {...panelMotion} className="evidenceLayout">
            <div className="evidenceHero">
              <p className="eyebrow">Selected OMS module</p>
              <h3>{activeModule.label}</h3>
              <p>{activeModule.polygonRole}</p>
              <div className="playbookGrid compactGrid">
                <PlaybookList label="Retain" items={recommendation.playbook.retained.slice(0, 3)} />
                <PlaybookList label="Replace" items={recommendation.playbook.replaced.slice(0, 3)} />
                <PlaybookList label="Wrap" items={recommendation.playbook.wrapped.slice(0, 3)} />
              </div>
            </div>
            <div className="competitorTable">
              {activeModule.providers.slice(0, 8).map((provider) => (
                <ProviderRow key={provider.id} provider={provider} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "controls" && (
          <motion.div key="controls" {...panelMotion} className="controlsLayout">
            <div className="controlGrid">
              {recommendation.compliance.map((control) => (
                <article key={control.id} className="controlCard">
                  <span>{control.phase}</span>
                  <strong>{control.label}</strong>
                  <p>{control.description}</p>
                </article>
              ))}
            </div>
            <div className="phaseRail">
              <p className="eyebrow">Migration phases</p>
              {recommendation.playbook.phases.map((phase, index) => (
                <div key={phase} className="phaseStep">
                  <span>{index + 1}</span>
                  <p>{phase}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "packet" && (
          <motion.div key="packet" {...panelMotion}>
            <PacketPanel
              input={input}
              recommendation={recommendation}
              activeModule={activeModule}
              packet={packet}
              packetTab={packetTab}
              exportedPitch={exportedPitch}
              isExporting={isExporting}
              onPacketTabChange={onPacketTabChange}
              onGeneratePacket={onGeneratePacket}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function BusinessCasePanel({
  input,
  recommendation,
  isExporting,
  onGenerateStrategy,
  onGeneratePacket,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  isExporting: boolean;
  onGenerateStrategy: () => void;
  onGeneratePacket: () => void;
}) {
  const reducedApis = Math.max(4, Math.ceil(input.apiSurfaceCount * 0.32));
  const reducedFeeds = Math.max(2, Math.ceil(input.reconciliationFeeds * 0.34));
  const modeledProviderCount =
    recommendation.costModel.selectedProviderCount || input.vendorCount;

  return (
    <aside className="businessPanel panel">
      <div className="businessHeader">
        <p className="eyebrow">Business case</p>
        <h2>{formatMoney(recommendation.costModel.firstYearNetSavings)}</h2>
        <span>Modeled first-year net savings</span>
      </div>

      <button className="strategyShortcut" type="button" onClick={onGenerateStrategy}>
        <Sparkles size={16} />
        Generate OMS Strategy
      </button>

      <div className="signalGrid">
        <SignalCard label="Providers" value={`${modeledProviderCount} to 1`} detail="OMS layer plus retained regulated partners" />
        <SignalCard label="APIs" value={`${input.apiSurfaceCount} to ${reducedApis}`} detail="fewer surfaces to secure and reconcile" />
        <SignalCard label="Recon feeds" value={`${input.reconciliationFeeds} to ${reducedFeeds}`} detail="single settlement event model" />
        <SignalCard
          label="Complexity"
          value={`${recommendation.costModel.integrationComplexityReduction}%`}
          detail="non-salary integration reduction"
        />
      </div>

      <ProviderCostBreakdown recommendation={recommendation} />

      <div className="waterfall">
        <WaterfallBar
          label="Fee delta"
          value={recommendation.costModel.feeDelta}
          max={recommendation.costModel.steadyStateAnnualSavings}
        />
        <WaterfallBar
          label="Vendor and recon consolidation"
          value={recommendation.costModel.fixedVendorSavings}
          max={recommendation.costModel.steadyStateAnnualSavings}
        />
        <WaterfallBar
          label="Liquidity release"
          value={recommendation.costModel.workingCapitalRelease}
          max={recommendation.costModel.steadyStateAnnualSavings}
        />
      </div>

      <div className="pricingNote">
        <Landmark size={16} />
        <p>
          Polygon OMS pricing is early-access/custom. This model uses public competitor pricing
          signals plus a Polygon network cost signal, not a fake OMS quote.
        </p>
      </div>

      <button className="primaryAction wide" type="button" onClick={onGeneratePacket}>
        <Download size={17} />
        {isExporting ? "Preparing packet" : "Generate PMM Packet"}
      </button>
    </aside>
  );
}

function PacketPanel({
  recommendation,
  activeModule,
  packet,
  packetTab,
  exportedPitch,
  isExporting,
  onPacketTabChange,
  onGeneratePacket,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  activeModule: OMSModule;
  packet: PacketSections;
  packetTab: PacketTab;
  exportedPitch: string;
  isExporting: boolean;
  onPacketTabChange: (tab: PacketTab) => void;
  onGeneratePacket: () => void;
}) {
  return (
    <div className="packetPanel">
      <div className="packetHeader">
        <div>
          <p className="eyebrow">PMM packet</p>
          <h3>Pitch-ready hiring artifact</h3>
        </div>
        <button className="secondaryAction" type="button" onClick={onGeneratePacket}>
          <RefreshCcw size={15} />
          {isExporting ? "Generating" : "Refresh packet"}
        </button>
      </div>

      <div className="packetTabs">
        <PacketTabButton active={packetTab === "memo"} onClick={() => onPacketTabChange("memo")}>
          Executive Memo
        </PacketTabButton>
        <PacketTabButton active={packetTab === "slides"} onClick={() => onPacketTabChange("slides")}>
          6-Slide Pitch
        </PacketTabButton>
        <PacketTabButton active={packetTab === "battlecard"} onClick={() => onPacketTabChange("battlecard")}>
          Battlecard
        </PacketTabButton>
        <PacketTabButton active={packetTab === "sources"} onClick={() => onPacketTabChange("sources")}>
          Source Appendix
        </PacketTabButton>
      </div>

      {packetTab === "memo" && (
        <div className="memoStack">
          {packet.memo.map((item) => (
            <article key={item.title} className="memoCard">
              <span>{item.kicker}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      )}

      {packetTab === "slides" && (
        <div className="slideGrid">
          {packet.slides.map((slide, index) => (
            <article key={slide.title} className="slideCard">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{slide.title}</strong>
              <p>{slide.body}</p>
            </article>
          ))}
        </div>
      )}

      {packetTab === "battlecard" && (
        <div className="battlecard">
          <div>
            <p className="eyebrow">Polygon angle</p>
            <h4>{activeModule.label}</h4>
            <p>{activeModule.polygonRole}</p>
          </div>
          <div className="battleRows">
            {recommendation.battlecards.slice(0, 4).map((card) => (
              <article key={card.moduleId}>
                <strong>{card.moduleLabel}</strong>
                <p>{card.polygonAngle}</p>
                <span>{card.competitors.slice(0, 4).map((provider) => provider.name).join(", ")}</span>
              </article>
            ))}
          </div>
        </div>
      )}

      {packetTab === "sources" && (
        <div className="sourceAppendix">
          {packet.sources.map((source) => (
            <a key={`${source.label}-${source.url}`} href={source.url} target="_blank" rel="noreferrer">
              <strong>{source.label}</strong>
              <span>{source.detail}</span>
              <ArrowRight size={14} />
            </a>
          ))}
          <details className="markdownPayload">
            <summary>Markdown payload from export API</summary>
            <textarea suppressHydrationWarning readOnly value={exportedPitch || packet.markdown} />
          </details>
        </div>
      )}
    </div>
  );
}

function MapLane({
  title,
  kicker,
  tone,
  children,
}: {
  title: string;
  kicker: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mapLane ${tone}`}>
      <div className="laneHeader">
        <span>{kicker}</span>
        <strong>{title}</strong>
      </div>
      <div className="laneStack">{children}</div>
    </div>
  );
}

function MapCard({ title, detail, tone }: { title: string; detail: string; tone: string }) {
  return (
    <article className={`mapCard ${tone}`}>
      <strong>{title}</strong>
      <span>{detail}</span>
    </article>
  );
}

function ProviderRow({ provider }: { provider: Provider }) {
  const evidence = pricing.find((item) => item.providerId === provider.id);

  return (
    <article className="providerRow">
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
        suppressHydrationWarning
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

function PacketTabButton({
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

function SignalCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="signalCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function ProviderCostBreakdown({ recommendation }: { recommendation: Recommendation }) {
  const lines = recommendation.costModel.providerCostLines
    .slice()
    .sort((a, b) => b.annualCost - a.annualCost)
    .slice(0, 6);

  if (lines.length === 0) {
    return (
      <div className="providerCostPanel">
        <div className="providerCostHeader">
          <span>Provider model</span>
          <strong>Blended scenario</strong>
        </div>
        <p>No providers selected. The model is using blended current-stack assumptions.</p>
      </div>
    );
  }

  return (
    <div className="providerCostPanel">
      <div className="providerCostHeader">
        <span>Selected provider model</span>
        <strong>{formatMoney(recommendation.costModel.selectedProviderAnnualCost)}</strong>
      </div>
      <div className="providerCostRows">
        {lines.map((line) => (
          <div key={line.providerId} className="providerCostRow">
            <div>
              <strong>{line.providerName}</strong>
              <span>
                {line.pricingBasis} / {line.confidence}
              </span>
            </div>
            <b>{formatMoney(line.annualCost)}</b>
          </div>
        ))}
      </div>
      <p>
        Plus {formatMoney(recommendation.costModel.operationalOverheadAnnualCost)} modeled
        API, reconciliation, and compliance handoff overhead.
      </p>
    </div>
  );
}

function WaterfallBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(5, Math.min(100, (value / Math.max(max, 1)) * 100));
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

type PacketSections = {
  memo: Array<{ kicker: string; title: string; body: string }>;
  slides: Array<{ title: string; body: string }>;
  sources: Array<{ label: string; detail: string; url: string }>;
  markdown: string;
};

function buildPacketSections(
  input: StudioInput,
  recommendation: Recommendation,
  activeModule: OMSModule,
): PacketSections {
  const modulesList = recommendation.modules.map((module) => module.label).join(", ");
  const modeledProviderCount =
    recommendation.costModel.selectedProviderCount || input.vendorCount;
  const currentComplexity = `${modeledProviderCount} modeled providers, ${input.apiSurfaceCount} APIs, ${input.reconciliationFeeds} reconciliation feeds`;
  const savings = formatMoney(recommendation.costModel.firstYearNetSavings);
  const steadyState = formatMoney(recommendation.costModel.steadyStateAnnualSavings);
  const providerCost = formatMoney(recommendation.costModel.selectedProviderAnnualCost);
  const overheadCost = formatMoney(recommendation.costModel.operationalOverheadAnnualCost);
  const sourceProviders = recommendation.modules
    .flatMap((module) => module.providers.slice(0, 2))
    .map((provider) => {
      const evidence = pricing.find((item) => item.providerId === provider.id);
      return evidence
        ? {
            label: provider.name,
            detail: provider.pricingSignal,
            url: evidence.url,
          }
        : null;
    })
    .filter((source): source is { label: string; detail: string; url: string } => Boolean(source))
    .slice(0, 10);

  return {
    memo: [
      {
        kicker: "Thesis",
        title: "Polygon OMS is a consolidation story, not cheap crypto rails.",
        body: `${recommendation.title} turns ${currentComplexity} into a single orchestration layer with retained regulated partners and a public-evidence business case.`,
      },
      {
        kicker: "Buyer pain",
        title: input.mode === "migration" ? "Existing fintech stacks are operationally over-fragmented." : "New builders lose time to vendor assembly.",
        body: recommendation.depthMoment,
      },
      {
        kicker: "Economic proof",
        title: `${savings} modeled first-year impact with ${steadyState} steady-state annual savings.`,
        body:
          recommendation.costModel.selectedProviderCount > 0
            ? `The current stack is computed from selected providers: ${providerCost} provider cost plus ${overheadCost} API/reconciliation/compliance overhead. Salary and headcount savings stay excluded.`
            : "The model excludes salary and headcount assumptions by default, then shows integration complexity separately so the pitch stays credible across hiring markets.",
      },
      {
        kicker: "PMM angle",
        title: "Sell the migration lab as proof of developer velocity and compliance readiness.",
        body: `The packet maps ${modulesList} to competitors, public pricing signals, compliance controls, migration phases, and source caveats.`,
      },
    ],
    slides: [
      {
        title: "Open Money Stack, framed for institutions",
        body: "Global rails for wallets, ramps, stablecoin settlement, chain services, compliance hooks, and bespoke blockchain infrastructure.",
      },
      {
        title: "The old stack is the risk surface",
        body: `Current model: ${currentComplexity}, ${input.complianceHandoffs} compliance handoffs, and ${input.settlementDays} day settlement assumptions.`,
      },
      {
        title: "Polygon OMS architecture",
        body: `One orchestration layer coordinates ${modulesList} while preserving regulated entities and local partners where required.`,
      },
      {
        title: "Business case",
        body: `${savings} modeled first-year net savings, ${recommendation.costModel.integrationComplexityReduction}% integration complexity reduction, with public pricing caveats visible.`,
      },
      {
        title: "Compliance and security",
        body: "Sanctions, wallet risk, Travel Rule, velocity limits, MPC policy approvals, audit logs, ledger reconciliation, and incident freeze controls stay explicit.",
      },
      {
        title: "PMM launch motion",
        body: "Use the lab for sales discovery, launch narratives, battlecards, customer segmentation, and source-backed pricing conversations.",
      },
    ],
    sources: [
      {
        label: "Polygon OMS pricing stance",
        detail: "Early access/custom, modeled here with public competitor evidence and Polygon network cost signals.",
        url: "https://polygon.technology/open-money-stack",
      },
      {
        label: activeModule.label,
        detail: activeModule.polygonRole,
        url: "https://docs.polygon.technology/oms/overview",
      },
      ...sourceProviders,
    ],
    markdown: buildExportPitch(input),
  };
}

function shortModuleLabel(label: string) {
  return label.replace("Blockchain-as-a-service ", "BaaS ").replace("Stablecoin ", "Stablecoin\n");
}
