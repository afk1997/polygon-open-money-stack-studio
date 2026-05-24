import { getUseCase } from "./data";
import { defaultInput, formatMoney, generateRecommendation, normalizeInput } from "./engine";
import {
  complianceControlIdsFromContext,
  mergeUniqueIds,
  moduleIdsFromContext,
} from "./input-context";
import type {
  DemoTrace,
  DraftRun,
  EvalFinding,
  StackCanvasEdge,
  StackCanvasNode,
  StudioInput,
  WorkflowDraftInput,
} from "./types";

const fallbackWorkflow =
  "Launch a cross-border dollar account with USDC settlement, local cash-out, wallet balances, sanctions checks, and reconciliation.";

export function buildDraftRun(rawInput: WorkflowDraftInput, provider: DraftRun["provider"] = "fallback", warning?: string): DraftRun {
  const input = normalizeDraftInput(rawInput);
  const recommendation = generateRecommendation(input);
  const workflow = rawInput.workflow?.trim() || fallbackWorkflow;
  const useCaseTitle = recommendation.title.replace(" with Polygon OMS", "").replace(" on Polygon OMS", "");

  return {
    id: `draft_${slugify(input.useCaseId)}_${Date.now()}`,
    provider,
    warning,
    title: input.mode === "launch" ? `${useCaseTitle} launch stack` : `${useCaseTitle} migration stack`,
    subtitle: summarizeWorkflow(workflow, input),
    input,
    recommendation,
    canvasNodes: buildCanvasNodes(workflow, input, recommendation, rawInput),
    canvasEdges: buildCanvasEdges(input),
    demoTrace: buildDemoTrace(workflow, input),
    evalFindings: buildEvalFindings(input, recommendation),
    generatedAt: new Date().toISOString(),
  };
}

export function normalizeDraftInput(rawInput: WorkflowDraftInput): StudioInput {
  const workflowContext = rawInput.workflowContext ?? rawInput.workflow ?? "";
  const contextModuleIds = moduleIdsFromContext(workflowContext);
  const contextComplianceIds = complianceControlIdsFromContext(workflowContext);
  const base = normalizeInput({
    ...defaultInput,
    ...rawInput,
    workflowContext,
    requiredModuleIds: mergeUniqueIds(rawInput.requiredModuleIds, contextModuleIds),
    complianceControlIds:
      (rawInput.complianceControlIds || contextComplianceIds.length > 0)
        ? mergeUniqueIds(rawInput.complianceControlIds, contextComplianceIds)
        : undefined,
    selectedProviderIds:
      rawInput.mode === "launch"
        ? rawInput.selectedProviderIds ?? []
        : rawInput.selectedProviderIds ?? defaultInput.selectedProviderIds,
  });
  const scale = rawInput.quizAnswers?.scale?.[0];
  const complianceCount = rawInput.quizAnswers?.compliance?.length ?? base.complianceHandoffs;
  const priority = rawInput.quizAnswers?.priority ?? [];
  const modeTuning = {
    apiSurfaceCount: priority.includes("least-vendors")
      ? Math.max(8, base.apiSurfaceCount - 4)
      : base.apiSurfaceCount,
    reconciliationFeeds: priority.includes("least-vendors")
      ? Math.max(3, base.reconciliationFeeds - 2)
      : base.reconciliationFeeds,
    settlementDays: priority.includes("fastest-launch")
      ? Math.min(base.settlementDays, 1)
      : base.settlementDays,
    complianceHandoffs: Math.max(2, Math.min(6, complianceCount)),
  };

  if (scale === "pilot") {
    return {
      ...base,
      ...modeTuning,
      monthlyVolume: 1500000,
      monthlyTransactions: 12000,
      activeWallets: 9000,
      vendorCount: base.mode === "launch" ? 5 : Math.max(base.selectedProviderIds.length, 5),
    };
  }

  if (scale === "growth") {
    return {
      ...base,
      ...modeTuning,
      monthlyVolume: 12000000,
      monthlyTransactions: 85000,
      activeWallets: 62000,
      vendorCount: base.mode === "launch" ? 7 : Math.max(base.selectedProviderIds.length, 7),
    };
  }

  if (scale === "institution") {
    return {
      ...base,
      ...modeTuning,
      monthlyVolume: 68000000,
      monthlyTransactions: 420000,
      activeWallets: 280000,
      vendorCount: base.mode === "launch" ? 9 : Math.max(base.selectedProviderIds.length, 9),
      apiSurfaceCount: priority.includes("least-vendors") ? 18 : 24,
      reconciliationFeeds: 8,
      complianceHandoffs: 6,
    };
  }

  return {
    ...base,
    ...modeTuning,
    vendorCount:
      base.mode === "migration" && base.selectedProviderIds.length > 0
        ? base.selectedProviderIds.length
        : base.vendorCount,
  };
}

function buildCanvasNodes(
  workflow: string,
  input: StudioInput,
  recommendation: ReturnType<typeof generateRecommendation>,
  rawInput: WorkflowDraftInput,
): StackCanvasNode[] {
  const modules = recommendation.modules.slice(0, 5);
  const retainedFromQuiz = rawInput.quizAnswers?.retained ?? [];
  const retained = retainedFromQuiz.length > 0
    ? retainedFromQuiz.slice(0, 4)
    : [
        ...recommendation.playbook.retained.slice(0, 2),
        ...recommendation.playbook.wrapped.slice(0, 2),
      ];
  const priorities = rawInput.quizAnswers?.priority ?? [];

  return [
    {
      id: "workflow",
      lane: "workflow",
      title: "Founder workflow",
      eyebrow: "input",
      body: workflow,
      chips: [input.mode === "launch" ? "launch" : "migration", getUseCase(input.useCaseId).name],
      x: 48,
      y: 120,
    },
    {
      id: "current",
      lane: "current",
      title: input.mode === "launch" ? "Launch requirements" : "Current stack",
      eyebrow: input.mode === "launch" ? "constraints" : "providers",
      body:
        input.mode === "launch"
          ? "Defined retained regulated partners, payout paths, compliance gates, and settlement targets before adding any non-OMS vendor."
          : `${input.selectedProviderIds.length || input.vendorCount} selected providers modeled as the current stack.`,
      chips:
        input.mode === "launch"
          ? retained.slice(0, 3)
          : [`${input.selectedProviderIds.length || input.vendorCount} vendors`, `${input.settlementDays}d settlement`],
      x: 48,
      y: 350,
    },
    {
      id: "oms-core",
      lane: "oms",
      title: "Polygon OMS orchestration",
      eyebrow: "oms core",
      body: "One integration coordinates wallet policy, stablecoin settlement, ramps, compliance hooks, and chain services.",
      chips: priorities.length > 0 ? priorities.slice(0, 3) : ["wallets", "settlement", "policy"],
      x: 310,
      y: 240,
    },
    ...modules.map((module, index) => ({
      id: `module-${module.id}`,
      lane: "oms" as const,
      title: module.label,
      eyebrow: "module",
      body: module.polygonRole,
      chips: module.providers.slice(0, 2).map((provider) => provider.name),
      x: 310,
      y: 470 + index * 178,
    })),
    ...retained.map((item, index) => ({
      id: `partner-${index}`,
      lane: "partner" as const,
      title: item,
      eyebrow: "retained",
      body: "Kept, wrapped, or phased with auditability and policy controls.",
      chips: ["regulated", "policy"],
      x: 570,
      y: 180 + index * 178,
    })),
    {
      id: "settlement",
      lane: "output",
      title: "Stablecoin settlement",
      eyebrow: "output",
      body: "Fee evidence, wallet movements, settlement events, and local payout state are exposed to the product ledger.",
      chips: ["USDC", "local payout", "ledger"],
      x: 780,
      y: 250,
    },
    {
      id: "eval",
      lane: "eval",
      title: "Eval plan",
      eyebrow: "evidence",
      body: `${formatMoney(recommendation.costModel.firstYearNetSavings)} first-year modeled impact, with compliance controls and pricing caveats attached.`,
      chips: ["savings", "controls", "sources"],
      x: 780,
      y: 510,
    },
  ];
}

function buildCanvasEdges(input: StudioInput): StackCanvasEdge[] {
  const edges: StackCanvasEdge[] = [
    { id: "workflow-current", source: "workflow", target: "current", label: "scope" },
    { id: "current-core", source: "current", target: "oms-core", label: "draft" },
    { id: "core-settlement", source: "oms-core", target: "settlement", label: "route" },
    { id: "settlement-eval", source: "settlement", target: "eval", label: "measure" },
  ];

  const requiredModules = input.requiredModuleIds?.length
    ? input.requiredModuleIds
    : getUseCase(input.useCaseId).requiredModules;

  requiredModules.forEach((moduleId) => {
    edges.push({
      id: `core-${moduleId}`,
      source: "oms-core",
      target: `module-${moduleId}`,
      label: "module",
    });
  });

  edges.push(
    { id: "core-partner-0", source: "oms-core", target: "partner-0", label: "retain" },
    { id: "core-partner-1", source: "oms-core", target: "partner-1", label: "retain" },
  );

  return edges;
}

function buildDemoTrace(workflow: string, input: StudioInput): DemoTrace {
  return {
    title: input.mode === "launch" ? "Launch flow mini-demo" : "Migration flow mini-demo",
    prompt: [
      workflow,
      `Volume: ${formatMoney(input.monthlyVolume)} monthly, ${input.monthlyTransactions.toLocaleString()} tx/mo`,
    ],
    transcript: [
      {
        actor: "user",
        label: "workflow",
        text: workflow,
      },
      {
        actor: "agent",
        label: "oms_router",
        text: "Mapped the workflow into wallet, compliance, stablecoin settlement, and payout orchestration steps.",
      },
      {
        actor: "tool",
        label: "cost_model",
        text: "Priced selected providers, API/reconciliation overhead, Polygon network signal, and settlement liquidity release.",
      },
      {
        actor: "agent",
        label: "launch_readiness",
        text: "Prepared architecture, retained partner assumptions, compliance gates, demo trace, and eval plan.",
      },
    ],
    actions: [
      { name: "extract_money_movement_path", status: "done" },
      { name: "map_oms_modules", status: "done" },
      { name: "price_selected_stack", status: "done" },
      { name: "attach_compliance_controls", status: "ready" },
      { name: "render_switch_report", status: "queued" },
    ],
    structuredOutput: {
      mode: input.mode,
      use_case: input.useCaseId,
      monthly_volume: input.monthlyVolume,
      selected_providers: input.selectedProviderIds,
      settlement_days: input.settlementDays,
    },
  };
}

function buildEvalFindings(
  input: StudioInput,
  recommendation: ReturnType<typeof generateRecommendation>,
): EvalFinding[] {
  return [
    {
      id: "savings",
      label: "Savings model",
      status: recommendation.costModel.firstYearNetSavings > 0 ? "ready" : "watch",
      detail: `${formatMoney(recommendation.costModel.firstYearNetSavings)} first-year modeled impact. Current-stack cost uses selected providers when provided.`,
    },
    {
      id: "pricing-confidence",
      label: "Pricing confidence",
      status: "watch",
      detail: "Published and public-signal provider lines are separated from custom-priced estimates; Polygon OMS pricing remains early-access/custom.",
    },
    {
      id: "compliance",
      label: "Compliance controls",
      status: "ready",
      detail: "Sanctions, KYC/KYB, KYT, Travel Rule, velocity limits, audit logs, reconciliation, and incident freeze controls are attached.",
    },
    {
      id: "launch-filter",
      label: input.mode === "launch" ? "Launch partner focus" : "Provider replacement",
      status: "ready",
      detail:
        input.mode === "launch"
          ? "Launch mode focuses on retained/non-Polygon partners instead of asking founders to select infra Polygon OMS already covers."
          : "Optimize Existing treats selected providers as the current stack and computes replacement/consolidation economics.",
    },
  ];
}

function summarizeWorkflow(workflow: string, input: StudioInput) {
  const trimmed = workflow.replace(/\s+/g, " ").trim();
  const summary = trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed;
  return `${summary} ${input.mode === "launch" ? "Drafted as a launch stack." : "Drafted as a migration stack."}`;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
