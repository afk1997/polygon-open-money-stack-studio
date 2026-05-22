"use client";

import {
  ArrowRight,
  Banknote,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Factory,
  FileText,
  GitBranch,
  Globe2,
  Layers3,
  Maximize2,
  Minus,
  Network,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ComponentType, PointerEvent } from "react";
import { modules, templates } from "@/lib/data";
import {
  buildExportPitch,
  defaultInput,
  formatMoney,
  generateRecommendation,
  normalizeInput,
} from "@/lib/engine";
import { buildDraftRun } from "@/lib/workflow";
import type {
  DraftRun,
  DraftStage,
  OMSModule,
  StackCanvasNode,
  StudioInput,
  StudioMode,
  WorkflowDraftInput,
} from "@/lib/types";

type QuizStepConfig = {
  id: string;
  title: string;
  detail: string;
  single?: boolean;
  options: Array<{ id: string; label: string; note: string }>;
};

const moduleIcons: Record<string, ComponentType<{ size?: number }>> = {
  "wallet-infra": WalletCards,
  crosschain: Network,
  "stablecoin-orchestration": Banknote,
  ramps: Globe2,
  "cross-border": GitBranch,
  "blockchain-integration": Boxes,
  cdk: Layers3,
  "compliance-security": ShieldCheck,
};

const sampleWorkflows = [
  "Users hold USD balances, receive stablecoin settlement, and cash out locally in Mexico, India, and the Philippines.",
  "A remittance app needs cheaper corridor settlement, local fiat payouts, sanctions checks, and reconciliation files.",
  "A payroll platform pays contractors in 20 countries with wallet limits, KYB/KYC, payout status, and audit logs.",
  "A PSP wants stablecoin acceptance and local merchant settlement without exposing merchants to crypto UX.",
];

const retainedPartnerOptions = [
  "Sponsor bank",
  "Licensed entity or program manager",
  "KYC/KYB provider",
  "Fraud and device risk",
  "Local payout partner",
  "Travel Rule vendor",
  "Treasury liquidity partner",
  "Customer support tooling",
];

const quizSteps: QuizStepConfig[] = [
  {
    id: "money",
    title: "What movement are we designing for?",
    detail: "This shapes the OMS modules and demo trace.",
    options: [
      { id: "cash-in-out", label: "Cash-in and local cash-out", note: "Fiat endpoints matter." },
      { id: "wallet-balance", label: "Wallet or dollar balance", note: "Ledger and policy matter." },
      { id: "merchant-settlement", label: "Merchant settlement", note: "Checkout and payout matter." },
      { id: "contractor-payout", label: "Contractor payouts", note: "KYB/KYC and mass payouts matter." },
      { id: "agent-payments", label: "Agent or x402 payments", note: "Limits and traceability matter." },
    ],
  },
  {
    id: "scale",
    title: "What scale should the model assume?",
    detail: "The owned cost engine uses this to set volume, tx count, wallets, and complexity.",
    single: true,
    options: [
      { id: "pilot", label: "Pilot", note: "Low volume, tight controls." },
      { id: "growth", label: "Growth", note: "Real corridors and provider costs." },
      { id: "institution", label: "Institution", note: "High volume, stricter ops." },
    ],
  },
  {
    id: "compliance",
    title: "Which controls are non-negotiable?",
    detail: "These controls appear in the eval plan and compliance story.",
    options: [
      { id: "kyc", label: "KYC/KYB", note: "Identity before movement." },
      { id: "sanctions", label: "Sanctions and PEP", note: "Screen before settlement." },
      { id: "kyt", label: "Wallet risk and KYT", note: "Monitor onchain exposure." },
      { id: "travel-rule", label: "Travel Rule", note: "For regulated corridors." },
      { id: "freeze", label: "Freeze controls", note: "Stop incidents fast." },
      { id: "audit", label: "Audit and reconciliation", note: "Evidence for ops." },
    ],
  },
  {
    id: "priority",
    title: "What should the recommendation optimize for?",
    detail: "This changes the narrative and what the inspector surfaces first.",
    options: [
      { id: "lowest-cost", label: "Lowest blended cost", note: "Fee delta first." },
      { id: "fastest-launch", label: "Fastest launch path", note: "Pilot plan first." },
      { id: "least-vendors", label: "Fewest APIs and vendors", note: "Consolidation first." },
      { id: "compliance-depth", label: "Compliance narrative", note: "Controls first." },
      { id: "pmm-story", label: "PMM pitch strength", note: "Battlecard first." },
    ],
  },
];

const understandingSteps = [
  "Reading use case",
  "Applying your context",
  "Running stack interview answers",
  "Mapping OMS modules",
  "Computing provider cost model",
  "Rendering demo and eval plan",
];

export function Studio() {
  const [input, setInput] = useState<StudioInput>(normalizeInput(defaultInput));
  const [workflow, setWorkflow] = useState(defaultWorkflow(defaultInput.useCaseId));
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string[]>>({
    money: ["wallet-balance"],
    scale: ["growth"],
    compliance: ["kyc", "sanctions", "kyt", "audit"],
    priority: ["least-vendors", "pmm-story"],
    retained: ["Sponsor bank", "KYC/KYB provider", "Fraud and device risk", "Local payout partner"],
  });
  const [otherNotes, setOtherNotes] = useState<Record<string, string>>({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [providerCategory, setProviderCategory] = useState("wallet-infra");
  const [stage, setStage] = useState<DraftStage>("blank");
  const [draft, setDraft] = useState<DraftRun | null>(null);
  const [draftingStep, setDraftingStep] = useState(0);
  const [isDrafting, setIsDrafting] = useState(false);
  const [zoom, setZoom] = useState(80);
  const [selectedNodeId, setSelectedNodeId] = useState("workflow");
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const useCase = templates.find((template) => template.id === input.useCaseId) ?? templates[0]!;
  const activeModules = modules.filter((module) => useCase.requiredModules.includes(module.id));
  const currentQuizStep = quizSteps[quizIndex];
  const draftInput: WorkflowDraftInput = useMemo(
    () => ({ ...input, workflow, quizAnswers, otherNotes }),
    [input, workflow, quizAnswers, otherNotes],
  );
  const recommendation = draft?.recommendation ?? generateRecommendation(input);
  const activeNode = draft?.canvasNodes.find((node) => node.id === selectedNodeId) ?? draft?.canvasNodes[0];
  const packet = useMemo(() => buildExportPitch(draft?.input ?? draftInput), [draft, draftInput]);

  function patchInput(patch: Partial<StudioInput>) {
    setInput((current) => normalizeInput({ ...current, ...patch }));
    setDraft(null);
    setStage("blank");
  }

  function setMode(mode: StudioMode) {
    patchInput({
      mode,
      vendorCount: mode === "launch" ? 5 : defaultInput.selectedProviderIds.length,
      apiSurfaceCount: mode === "launch" ? 8 : 18,
      reconciliationFeeds: mode === "launch" ? 3 : 6,
      complianceHandoffs: mode === "launch" ? 3 : 4,
      settlementDays: mode === "launch" ? 1.5 : 3,
      selectedProviderIds: mode === "launch" ? [] : defaultInput.selectedProviderIds,
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
    setWorkflow(defaultWorkflow(useCaseId));
    setProviderCategory(selected.requiredModules[0] ?? "wallet-infra");
  }

  function toggleQuizAnswer(stepId: string, value: string, multi = true) {
    setQuizAnswers((current) => {
      const existing = current[stepId] ?? [];
      const next = multi
        ? existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value]
        : [value];
      return { ...current, [stepId]: next };
    });
    setDraft(null);
    setStage("blank");
  }

  function toggleProvider(providerId: string) {
    setInput((current) => {
      const selected = new Set(current.selectedProviderIds);
      if (selected.has(providerId)) selected.delete(providerId);
      else selected.add(providerId);
      return normalizeInput({
        ...current,
        selectedProviderIds: Array.from(selected),
        vendorCount: Math.max(selected.size, 1),
      });
    });
    setDraft(null);
    setStage("blank");
  }

  async function draftStack() {
    setIsDrafting(true);
    setStage("understanding");
    setDraftingStep(0);
    setSelectedNodeId("workflow");
    setNodeOffsets({});

    const request = fetch("/api/draft-stack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draftInput),
    }).then((response) => response.json() as Promise<{ draft: DraftRun }>);

    for (let index = 0; index < understandingSteps.length; index += 1) {
      await wait(240);
      setDraftingStep(index);
    }

    try {
      const payload = await request;
      setDraft(payload.draft);
    } catch {
      setDraft(buildDraftRun(draftInput, "fallback", "Local deterministic engine used because the AI adapter was unavailable."));
    } finally {
      setStage("stack");
      setIsDrafting(false);
    }
  }

  function beginDrag(nodeId: string, event: PointerEvent<HTMLElement>) {
    const current = nodeOffsets[nodeId] ?? { x: 0, y: 0 };
    setDragging({
      id: nodeId,
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    if (!dragging) return;
    const scale = zoom / 100;
    setNodeOffsets((current) => ({
      ...current,
      [dragging.id]: {
        x: dragging.originX + (event.clientX - dragging.startX) / scale,
        y: dragging.originY + (event.clientY - dragging.startY) / scale,
      },
    }));
  }

  return (
    <main className="studioShell" onPointerMove={moveDrag} onPointerUp={() => setDragging(null)}>
      <TopBar stage={stage} draft={draft} onStageChange={setStage} />
      <section className="studioWorkspace">
        <IntakeRail
          input={input}
          workflow={workflow}
          quizAnswers={quizAnswers}
          otherNotes={otherNotes}
          quizIndex={quizIndex}
          currentQuizStep={currentQuizStep}
          useCase={useCase}
          activeModules={activeModules}
          providerCategory={providerCategory}
          isDrafting={isDrafting}
          onWorkflowChange={setWorkflow}
          onUseCaseChange={setUseCase}
          onModeChange={setMode}
          onInputPatch={patchInput}
          onQuizAnswer={toggleQuizAnswer}
          onOtherNote={(stepId, value) => setOtherNotes((current) => ({ ...current, [stepId]: value }))}
          onQuizIndexChange={setQuizIndex}
          onProviderCategoryChange={setProviderCategory}
          onProviderToggle={toggleProvider}
          onDraft={draftStack}
        />
        <CanvasStage
          input={input}
          draft={draft}
          stage={stage}
          zoom={zoom}
          selectedNodeId={selectedNodeId}
          nodeOffsets={nodeOffsets}
          draftingStep={draftingStep}
          onZoomChange={setZoom}
          onStageChange={setStage}
          onNodeSelect={setSelectedNodeId}
          onNodeDrag={beginDrag}
        />
        <Inspector
          stage={stage}
          input={input}
          draft={draft}
          activeNode={activeNode}
          recommendation={recommendation}
          packet={packet}
          onStageChange={setStage}
        />
      </section>
    </main>
  );
}

function TopBar({
  stage,
  draft,
  onStageChange,
}: {
  stage: DraftStage;
  draft: DraftRun | null;
  onStageChange: (stage: DraftStage) => void;
}) {
  const steps: Array<{ id: DraftStage; label: string }> = [
    { id: "blank", label: "Read workflow" },
    { id: "understanding", label: "Draft stack" },
    { id: "stack", label: "Canvas" },
    { id: "demo", label: "Demo trace" },
    { id: "eval", label: "Eval plan" },
  ];

  return (
    <header className="studioTop">
      <div className="studioBrand">
        <span className="brandGlyph"><Boxes size={17} /></span>
        <strong>Polygon OMS Stack Studio</strong>
        <span>use case to evaluated money stack</span>
      </div>
      <nav className="stageRail" aria-label="Draft stages">
        {steps.map((item, index) => (
          <button
            key={item.id}
            className={stage === item.id ? "active" : ""}
            type="button"
            disabled={!draft && item.id !== "blank" && item.id !== "understanding"}
            onClick={() => onStageChange(item.id)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="providerBadge">
        <span>{draft?.provider === "fallback" || !draft ? "local model" : draft.provider}</span>
      </div>
    </header>
  );
}

function IntakeRail({
  input,
  workflow,
  quizAnswers,
  otherNotes,
  quizIndex,
  currentQuizStep,
  useCase,
  activeModules,
  providerCategory,
  isDrafting,
  onWorkflowChange,
  onUseCaseChange,
  onModeChange,
  onInputPatch,
  onQuizAnswer,
  onOtherNote,
  onQuizIndexChange,
  onProviderCategoryChange,
  onProviderToggle,
  onDraft,
}: {
  input: StudioInput;
  workflow: string;
  quizAnswers: Record<string, string[]>;
  otherNotes: Record<string, string>;
  quizIndex: number;
  currentQuizStep: QuizStepConfig;
  useCase: (typeof templates)[number];
  activeModules: OMSModule[];
  providerCategory: string;
  isDrafting: boolean;
  onWorkflowChange: (value: string) => void;
  onUseCaseChange: (useCaseId: string) => void;
  onModeChange: (mode: StudioMode) => void;
  onInputPatch: (patch: Partial<StudioInput>) => void;
  onQuizAnswer: (stepId: string, value: string, multi?: boolean) => void;
  onOtherNote: (stepId: string, value: string) => void;
  onQuizIndexChange: (index: number) => void;
  onProviderCategoryChange: (category: string) => void;
  onProviderToggle: (providerId: string) => void;
  onDraft: () => void;
}) {
  const isScopeStep = quizIndex >= quizSteps.length;

  return (
    <aside className="intakeRail">
      <div className="introCopy">
        <h1>
          Select a use case. Tune the stack. Draft the OMS plan.
        </h1>
        <p>Costs come from the studio data pack. AI only helps interpret the workflow and sharpen the output.</p>
      </div>

      <div className="modeSwitch">
        <button className={input.mode === "launch" ? "active" : ""} type="button" onClick={() => onModeChange("launch")}>
          <Sparkles size={15} /> Launch New
        </button>
        <button className={input.mode === "migration" ? "active" : ""} type="button" onClick={() => onModeChange("migration")}>
          <Factory size={15} /> Modernize Existing
        </button>
      </div>

      <section className="railSection">
        <div className="railHeader">
          <span>Use case</span>
          <strong>{useCase.segment}</strong>
        </div>
        <div className="useCaseScroller">
          {templates.map((template) => (
            <button
              key={template.id}
              className={input.useCaseId === template.id ? "active" : ""}
              type="button"
              onClick={() => onUseCaseChange(template.id)}
            >
              <strong>{template.name}</strong>
              <span>{template.defaultCorridors}</span>
            </button>
          ))}
        </div>
      </section>

      <label className="workflowBox">
        <div className="railHeader">
          <span>Your extra context</span>
          <strong>Optional</strong>
        </div>
        <textarea
          suppressHydrationWarning
          value={workflow}
          onChange={(event) => onWorkflowChange(event.target.value)}
        />
      </label>

      <details className="sampleStack">
        <summary>
          <span>Fast fills</span>
          <strong>Examples</strong>
        </summary>
        {sampleWorkflows.map((sample) => (
          <button key={sample} type="button" onClick={() => onWorkflowChange(sample)}>
            {sample}
          </button>
        ))}
      </details>

      <section className="quizShell">
        <div className="quizHeader">
          <div>
            <span>Stack interview</span>
            <strong>{isScopeStep ? "Scope and cost inputs" : currentQuizStep.title}</strong>
          </div>
          <small>{Math.min(quizIndex + 1, quizSteps.length + 1)}/{quizSteps.length + 1}</small>
        </div>

        {isScopeStep ? (
          <StackScope
            input={input}
            activeModules={activeModules}
            providerCategory={providerCategory}
            retainedAnswers={quizAnswers.retained ?? []}
            onInputPatch={onInputPatch}
            onProviderCategoryChange={onProviderCategoryChange}
            onProviderToggle={onProviderToggle}
            onQuizAnswer={onQuizAnswer}
          />
        ) : (
          <QuizStep
            step={currentQuizStep}
            answers={quizAnswers[currentQuizStep.id] ?? []}
            other={otherNotes[currentQuizStep.id] ?? ""}
            onToggle={(value, multi) => onQuizAnswer(currentQuizStep.id, value, multi)}
            onOther={(value) => onOtherNote(currentQuizStep.id, value)}
          />
        )}

        <div className="quizControls">
          <button type="button" onClick={() => onQuizIndexChange(Math.max(0, quizIndex - 1))}>
            <ChevronLeft size={15} /> Back
          </button>
          <button
            type="button"
            onClick={() => onQuizIndexChange(Math.min(quizSteps.length, quizIndex + 1))}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </section>

      <button className="draftButton" type="button" onClick={onDraft} disabled={isDrafting}>
        <span>{isDrafting ? "Drafting the stack" : "Draft the stack"}</span>
        <ArrowRight size={20} />
      </button>
    </aside>
  );
}

function QuizStep({
  step,
  answers,
  other,
  onToggle,
  onOther,
}: {
  step: QuizStepConfig;
  answers: string[];
  other: string;
  onToggle: (value: string, multi?: boolean) => void;
  onOther: (value: string) => void;
}) {
  return (
    <div className="quizStep">
      <p>{step.detail}</p>
      <div className="answerGrid">
        {step.options.map((option) => (
          <button
            key={option.id}
            className={answers.includes(option.id) ? "selected" : ""}
            type="button"
            onClick={() => onToggle(option.id, !step.single)}
          >
            <span>
              {answers.includes(option.id) && <CheckCircle2 size={15} />}
              {option.label}
            </span>
            <small>{option.note}</small>
          </button>
        ))}
      </div>
      <textarea
        suppressHydrationWarning
        placeholder="Other detail, constraint, region, or odd edge case..."
        value={other}
        onChange={(event) => onOther(event.target.value)}
      />
    </div>
  );
}

function StackScope({
  input,
  activeModules,
  providerCategory,
  retainedAnswers,
  onInputPatch,
  onProviderCategoryChange,
  onProviderToggle,
  onQuizAnswer,
}: {
  input: StudioInput;
  activeModules: OMSModule[];
  providerCategory: string;
  retainedAnswers: string[];
  onInputPatch: (patch: Partial<StudioInput>) => void;
  onProviderCategoryChange: (category: string) => void;
  onProviderToggle: (providerId: string) => void;
  onQuizAnswer: (stepId: string, value: string, multi?: boolean) => void;
}) {
  const activeCategory = modules.find((module) => module.id === providerCategory) ?? activeModules[0] ?? modules[0]!;

  return (
    <div className="stackScope">
      <ModelInputs input={input} onInputPatch={onInputPatch} />

      {input.mode === "launch" ? (
        <div className="launchPartners">
          <p>For new builds, the studio hides Polygon-covered infra competitors and asks only for partners that may still be needed.</p>
          <div className="answerGrid">
            {retainedPartnerOptions.map((partner) => (
              <button
                key={partner}
                className={retainedAnswers.includes(partner) ? "selected" : ""}
                type="button"
                onClick={() => onQuizAnswer("retained", partner)}
              >
                <span>
                  {retainedAnswers.includes(partner) && <CheckCircle2 size={15} />}
                  {partner}
                </span>
                <small>Retained or wrapped</small>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="providerScope">
          <p>For migrations, selected point-solution providers become the current stack and directly compute modeled annual cost.</p>
          <div className="moduleTabs">
            {modules.map((module) => {
              const selectedInModule = module.providers.filter((provider) =>
                input.selectedProviderIds.includes(provider.id),
              ).length;
              return (
                <button
                  key={module.id}
                  className={providerCategory === module.id ? "active" : ""}
                  type="button"
                  onClick={() => onProviderCategoryChange(module.id)}
                >
                  {module.label}
                  {selectedInModule > 0 && <span>{selectedInModule}</span>}
                </button>
              );
            })}
          </div>
          <div className="providerGrid">
            {activeCategory.providers.map((provider) => (
              <button
                key={provider.id}
                className={input.selectedProviderIds.includes(provider.id) ? "selected" : ""}
                type="button"
                onClick={() => onProviderToggle(provider.id)}
              >
                <span>
                  {input.selectedProviderIds.includes(provider.id) && <CheckCircle2 size={15} />}
                  {provider.name}
                </span>
                <small>{provider.pricingSignal}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelInputs({
  input,
  onInputPatch,
}: {
  input: StudioInput;
  onInputPatch: (patch: Partial<StudioInput>) => void;
}) {
  return (
    <div className="modelInputs">
      <label>
        <span>Monthly volume</span>
        <input
          type="number"
          value={input.monthlyVolume}
          onChange={(event) => onInputPatch({ monthlyVolume: Number(event.target.value) })}
        />
      </label>
      <label>
        <span>Tx / month</span>
        <input
          type="number"
          value={input.monthlyTransactions}
          onChange={(event) => onInputPatch({ monthlyTransactions: Number(event.target.value) })}
        />
      </label>
      <label>
        <span>Active wallets</span>
        <input
          type="number"
          value={input.activeWallets}
          onChange={(event) => onInputPatch({ activeWallets: Number(event.target.value) })}
        />
      </label>
      <label>
        <span>Settlement days</span>
        <input
          type="number"
          step="0.25"
          value={input.settlementDays}
          onChange={(event) => onInputPatch({ settlementDays: Number(event.target.value) })}
        />
      </label>
      <label className="wide">
        <span>Corridors</span>
        <input
          value={input.corridors}
          onChange={(event) => onInputPatch({ corridors: event.target.value })}
        />
      </label>
    </div>
  );
}

function CanvasStage({
  input,
  draft,
  stage,
  zoom,
  selectedNodeId,
  nodeOffsets,
  draftingStep,
  onZoomChange,
  onStageChange,
  onNodeSelect,
  onNodeDrag,
}: {
  input: StudioInput;
  draft: DraftRun | null;
  stage: DraftStage;
  zoom: number;
  selectedNodeId: string;
  nodeOffsets: Record<string, { x: number; y: number }>;
  draftingStep: number;
  onZoomChange: (zoom: number) => void;
  onStageChange: (stage: DraftStage) => void;
  onNodeSelect: (id: string) => void;
  onNodeDrag: (id: string, event: PointerEvent<HTMLElement>) => void;
}) {
  const title =
    stage === "blank"
      ? "Awaiting a money workflow"
      : stage === "understanding"
        ? "Understanding workflow..."
        : draft?.title ?? "Drafted OMS canvas";

  return (
    <section className="canvasStage">
      <div className="canvasHeader">
        <div>
          <p>{stage === "blank" ? "Blank canvas" : draft?.provider === "fallback" || !draft ? "Local pricing engine" : "AI-assisted draft"}</p>
          <h2>{title}</h2>
          <span>
            {stage === "blank"
              ? "Select a use case, add context, answer the stack interview, then draft."
              : draft?.subtitle ?? `${input.mode === "launch" ? "Launch" : "Migration"} evaluation in progress.`}
          </span>
        </div>
        <div className="canvasControls">
          <button type="button" onClick={() => onStageChange("demo")} disabled={!draft}>
            <FileText size={15} /> Demo
          </button>
          <button type="button" onClick={() => onStageChange("eval")} disabled={!draft}>
            <ClipboardList size={15} /> Eval
          </button>
          <button type="button" onClick={() => onZoomChange(Math.max(55, zoom - 10))}>
            <Minus size={15} />
          </button>
          <span>{zoom}%</span>
          <button type="button" onClick={() => onZoomChange(Math.min(120, zoom + 10))}>
            <Plus size={15} />
          </button>
          <button type="button" onClick={() => onZoomChange(80)}>
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      <div className="canvasPlane">
        {stage === "blank" && <BlankCanvas />}
        {stage === "understanding" && <UnderstandingCanvas activeIndex={draftingStep} />}
        {draft && stage !== "blank" && stage !== "understanding" && (
          <GraphCanvas
            draft={draft}
            zoom={zoom}
            selectedNodeId={selectedNodeId}
            nodeOffsets={nodeOffsets}
            onNodeSelect={onNodeSelect}
            onNodeDrag={onNodeDrag}
          />
        )}
        <div className="canvasHint">
          <span>Canvas</span> drag nodes · tune inputs · rerun the draft
        </div>
      </div>
    </section>
  );
}

function BlankCanvas() {
  return (
    <motion.div
      className="blankCanvas"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <Boxes size={34} />
      <h3>Draft the stack</h3>
      <p>The canvas will sketch OMS modules, retained partners, selected-provider costs, a demo trace, and eval plan.</p>
    </motion.div>
  );
}

function UnderstandingCanvas({ activeIndex }: { activeIndex: number }) {
  return (
    <motion.div
      className="understandingCard"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28 }}
    >
      <p>Building stack</p>
      <h3>{understandingSteps[activeIndex] ?? understandingSteps[0]}</h3>
      <ol>
        {understandingSteps.map((step, index) => (
          <li key={step} className={index <= activeIndex ? "active" : ""}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {step}
          </li>
        ))}
      </ol>
    </motion.div>
  );
}

function GraphCanvas({
  draft,
  zoom,
  selectedNodeId,
  nodeOffsets,
  onNodeSelect,
  onNodeDrag,
}: {
  draft: DraftRun;
  zoom: number;
  selectedNodeId: string;
  nodeOffsets: Record<string, { x: number; y: number }>;
  onNodeSelect: (id: string) => void;
  onNodeDrag: (id: string, event: PointerEvent<HTMLElement>) => void;
}) {
  const nodesById = new Map(draft.canvasNodes.map((node) => [node.id, withOffset(node, nodeOffsets[node.id])]));

  return (
    <div className="graphViewport">
      <motion.div
        className="graphPlane"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: zoom / 100 }}
        transition={{ duration: 0.32 }}
      >
        <svg className="edgeLayer" width="1220" height="1400" viewBox="0 0 1220 1400">
          {draft.canvasEdges.map((edge) => {
            const source = nodesById.get(edge.source);
            const target = nodesById.get(edge.target);
            if (!source || !target) return null;
            const sx = source.x + 260;
            const sy = source.y + 82;
            const tx = target.x;
            const ty = target.y + 82;
            const mid = sx + Math.max(80, (tx - sx) / 2);
            return (
              <g key={edge.id}>
                <motion.path
                  d={`M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${tx} ${ty}`}
                  fill="none"
                  stroke="#7d9bdb"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 8} className="edgeText">
                  {edge.label}
                </text>
              </g>
            );
          })}
        </svg>
        {draft.canvasNodes.map((node, index) => {
          const positioned = withOffset(node, nodeOffsets[node.id]);
          const Icon = node.lane === "oms" ? moduleIcons[node.id.replace("module-", "")] ?? Boxes : laneIcon(node.lane);
          return (
            <motion.article
              key={node.id}
              className={`stackNode ${node.lane} ${selectedNodeId === node.id ? "active" : ""}`}
              style={{ left: positioned.x, top: positioned.y }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.035 }}
              onPointerDown={(event) => onNodeDrag(node.id, event)}
              onClick={() => onNodeSelect(node.id)}
            >
              <div className="nodeTop">
                <span><Icon size={13} /> {node.eyebrow}</span>
                <small>{node.lane}</small>
              </div>
              <strong>{node.title}</strong>
              <p>{node.body}</p>
              <div className="nodeChips">
                {node.chips.slice(0, 3).map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </div>
  );
}

function Inspector({
  stage,
  input,
  draft,
  activeNode,
  recommendation,
  packet,
  onStageChange,
}: {
  stage: DraftStage;
  input: StudioInput;
  draft: DraftRun | null;
  activeNode?: StackCanvasNode;
  recommendation: ReturnType<typeof generateRecommendation>;
  packet: string;
  onStageChange: (stage: DraftStage) => void;
}) {
  return (
    <aside className="inspector">
      <div className="inspectorTabs">
        {(["stack", "demo", "eval", "packet"] as DraftStage[]).map((item) => (
          <button
            key={item}
            className={stage === item ? "active" : ""}
            type="button"
            disabled={!draft}
            onClick={() => onStageChange(item)}
          >
            {item === "packet" ? "PMM" : item}
          </button>
        ))}
      </div>

      {!draft ? (
        <div className="emptyInspector">
          <p>Evaluation waits here.</p>
          <span>The stack interview and selected providers will drive the savings model after drafting.</span>
          <div className="metricGrid">
            <Metric label="Mode" value={input.mode === "launch" ? "Launch" : "Modernize"} />
            <Metric label="Monthly volume" value={formatMoney(input.monthlyVolume)} />
            <Metric label="Providers selected" value={String(input.selectedProviderIds.length)} />
            <Metric label="Settlement drag" value={`${input.settlementDays}d`} />
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {stage === "demo" ? (
            <DemoInspector key="demo" draft={draft} />
          ) : stage === "eval" ? (
            <EvalInspector key="eval" draft={draft} />
          ) : stage === "packet" ? (
            <PacketInspector key="packet" draft={draft} packet={packet} />
          ) : (
            <StackInspector
              key="stack"
              input={input}
              draft={draft}
              activeNode={activeNode}
              recommendation={recommendation}
            />
          )}
        </AnimatePresence>
      )}
    </aside>
  );
}

function StackInspector({
  input,
  draft,
  activeNode,
  recommendation,
}: {
  input: StudioInput;
  draft: DraftRun;
  activeNode?: StackCanvasNode;
  recommendation: ReturnType<typeof generateRecommendation>;
}) {
  const costModel = recommendation.costModel;

  return (
    <motion.div className="inspectorPanel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <p className="inspectorKicker">Selected node</p>
      <h3>{activeNode?.title ?? draft.title}</h3>
      <p>{activeNode?.body ?? draft.subtitle}</p>

      <div className="metricGrid">
        <Metric label="First-year impact" value={formatMoney(costModel.firstYearNetSavings)} />
        <Metric label="Selected provider cost" value={formatMoney(costModel.selectedProviderAnnualCost)} />
        <Metric label="API reduction" value={`${costModel.integrationComplexityReduction}%`} />
        <Metric label="Mode" value={input.mode === "launch" ? "Launch" : "Modernize"} />
      </div>

      <div className="callout">
        {costModel.selectedProviderCount > 0
          ? `Current cost is computed from ${costModel.selectedProviderCount} selected point-solution providers plus integration and reconciliation overhead.`
          : "No point-solution providers selected. The studio is using the blended launch scenario model."}
      </div>
      {draft.warning && <div className="warningBox">{draft.warning}</div>}
      <button className="exportButton" type="button">
        <Download size={16} /> Export PNG
      </button>
    </motion.div>
  );
}

function DemoInspector({ draft }: { draft: DraftRun }) {
  return (
    <motion.div className="inspectorPanel demoPanel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <p className="inspectorKicker">Mini demo</p>
      <h3>{draft.demoTrace.title}</h3>
      <div className="promptPills">
        {draft.demoTrace.prompt.map((prompt) => (
          <span key={prompt}>{prompt}</span>
        ))}
      </div>
      <div className="traceStack">
        {draft.demoTrace.transcript.map((item) => (
          <article key={`${item.actor}-${item.label}`} className={item.actor}>
            <span>{item.actor} / {item.label}</span>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <div className="actionRows">
        {draft.demoTrace.actions.map((action) => (
          <div key={action.name}>
            <code>{action.name}</code>
            <span>{action.status}</span>
          </div>
        ))}
      </div>
      <pre>{JSON.stringify(draft.demoTrace.structuredOutput, null, 2)}</pre>
    </motion.div>
  );
}

function EvalInspector({ draft }: { draft: DraftRun }) {
  const costModel = draft.recommendation.costModel;
  const providerLines = costModel.providerCostLines
    .slice()
    .sort((a, b) => b.annualCost - a.annualCost)
    .slice(0, 8);

  return (
    <motion.div className="inspectorPanel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <p className="inspectorKicker">Eval plan</p>
      <h3>{formatMoney(costModel.firstYearNetSavings)} modeled first-year impact</h3>
      <div className="waterfall">
        <Metric label="Fee delta" value={formatMoney(costModel.feeDelta)} />
        <Metric label="Fixed vendor savings" value={formatMoney(costModel.fixedVendorSavings)} />
        <Metric label="Working capital release" value={formatMoney(costModel.workingCapitalRelease)} />
        <Metric label="Migration cost" value={`-${formatMoney(costModel.migrationCost)}`} />
      </div>
      <div className="evalList">
        {draft.evalFindings.map((finding) => (
          <article key={finding.id} className={finding.status}>
            <span>{finding.status}</span>
            <strong>{finding.label}</strong>
            <p>{finding.detail}</p>
          </article>
        ))}
      </div>
      <div className="providerCostMini">
        {providerLines.length > 0 ? (
          providerLines.map((line) => (
            <div key={`${line.providerId}-${line.moduleId}`}>
              <span>{line.providerName}</span>
              <small>{line.moduleLabel} / {line.confidence}</small>
              <strong>{formatMoney(line.annualCost)}</strong>
            </div>
          ))
        ) : (
          <div>
            <span>Launch model</span>
            <small>Blended provider-market estimate</small>
            <strong>{formatMoney(costModel.currentAnnualCost)}</strong>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PacketInspector({ draft, packet }: { draft: DraftRun; packet: string }) {
  const recommendation = draft.recommendation;

  return (
    <motion.div className="inspectorPanel packetPanel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <p className="inspectorKicker">PMM packet</p>
      <h3>Pitch-ready output</h3>
      <section>
        <strong>Executive memo</strong>
        <p>{recommendation.narrative}</p>
      </section>
      <section>
        <strong>6-slide pitch</strong>
        <ol>
          <li>Problem: fragmented money movement stack.</li>
          <li>OMS architecture: one orchestration layer.</li>
          <li>Migration or launch path by phase.</li>
          <li>Cost model and selected provider evidence.</li>
          <li>Compliance and security controls.</li>
          <li>Why Polygon wins the category narrative.</li>
        </ol>
      </section>
      <section>
        <strong>Battlecard</strong>
        <p>{recommendation.depthMoment}</p>
      </section>
      <details>
        <summary>Source appendix markdown</summary>
        <textarea suppressHydrationWarning readOnly value={packet} />
      </details>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function withOffset(node: StackCanvasNode, offset?: { x: number; y: number }) {
  return {
    ...node,
    x: node.x + (offset?.x ?? 0),
    y: node.y + (offset?.y ?? 0),
  };
}

function laneIcon(lane: StackCanvasNode["lane"]) {
  if (lane === "current") return Factory;
  if (lane === "partner") return ShieldCheck;
  if (lane === "output") return Globe2;
  if (lane === "eval") return ClipboardList;
  return FileText;
}

function defaultWorkflow(useCaseId: string) {
  const selected = templates.find((template) => template.id === useCaseId) ?? templates[0]!;
  return `${selected.headline} I want the studio to show the OMS architecture, retained partners, pricing evidence, compliance controls, and PMM-ready pitch.`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
