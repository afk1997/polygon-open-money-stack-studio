import { controls, getUseCase, modules, playbooks, pricing } from "./data";
import type {
  ArchitectureEdge,
  ArchitectureNode,
  Battlecard,
  CostModel,
  MigrationPlaybook,
  OMSModule,
  Recommendation,
  StudioInput,
} from "./types";

const POLYGON_NETWORK_TX_COST_USD = 0.002;
const TREASURY_YIELD = 0.045;

export const defaultInput: StudioInput = {
  mode: "migration",
  useCaseId: "neobank-dollar-account",
  monthlyVolume: 24000000,
  monthlyTransactions: 180000,
  activeWallets: 135000,
  settlementDays: 3,
  vendorCount: 11,
  apiSurfaceCount: 18,
  reconciliationFeeds: 6,
  complianceHandoffs: 4,
  selectedProviderIds: [
    "circle-wallets",
    "fireblocks",
    "bridge",
    "moonpay",
    "ramp-network",
    "wise-platform",
    "airwallex",
    "chainalysis",
    "trm",
    "alchemy",
    "chainlink-ccip",
  ],
  corridors: "USDC to MXN, BRL, PHP, INR",
};

export function normalizeInput(input: Partial<StudioInput>): StudioInput {
  const useCase = getUseCase(input.useCaseId ?? defaultInput.useCaseId);

  return {
    ...defaultInput,
    useCaseId: useCase.id,
    monthlyVolume: input.monthlyVolume ?? useCase.defaultVolume,
    monthlyTransactions: input.monthlyTransactions ?? useCase.defaultTransactions,
    activeWallets: input.activeWallets ?? useCase.defaultWallets,
    corridors: input.corridors ?? useCase.defaultCorridors,
    ...input,
  };
}

export function calculateCostModel(rawInput: Partial<StudioInput>): CostModel {
  const input = normalizeInput(rawInput);
  const modeFactor = input.mode === "migration" ? 1 : 0.72;
  const currentBps = input.mode === "migration" ? 92 : 118;
  const modeledOrchestrationBps = input.mode === "migration" ? 34 : 42;
  const currentAnnualVariable =
    input.monthlyVolume * 12 * (currentBps / 10000) * modeFactor;
  const modeledOmsVariable =
    input.monthlyVolume * 12 * (modeledOrchestrationBps / 10000);
  const publicNetworkSignal =
    input.monthlyTransactions * 12 * POLYGON_NETWORK_TX_COST_USD;
  const currentAnnualFixed =
    Math.max(input.vendorCount, 1) * 3250 * 12 +
    input.apiSurfaceCount * 7400 +
    input.reconciliationFeeds * 18200;
  const modeledOmsAnnualFixed =
    148000 + Math.max(input.complianceHandoffs - 2, 0) * 9200;
  const currentAnnualCost = currentAnnualVariable + currentAnnualFixed;
  const modeledOmsAnnualCost =
    modeledOmsVariable + modeledOmsAnnualFixed + publicNetworkSignal;
  const feeDelta = Math.max(currentAnnualVariable - modeledOmsVariable, 0);
  const fixedVendorSavings = Math.max(currentAnnualFixed - modeledOmsAnnualFixed, 0);
  const workingCapitalRelease =
    input.monthlyVolume * 12 * (Math.max(input.settlementDays - 0.25, 0) / 365) * TREASURY_YIELD;
  const currentComplexityScore =
    input.vendorCount * 3 +
    input.apiSurfaceCount * 2 +
    input.reconciliationFeeds * 4 +
    input.complianceHandoffs * 3;
  const modeledOmsComplexityScore = 12 + Math.max(input.complianceHandoffs - 2, 0) * 2;
  const integrationComplexityReduction = Math.round(
    Math.max(0, 1 - modeledOmsComplexityScore / Math.max(currentComplexityScore, 1)) * 100,
  );
  const migrationCost =
    (input.mode === "migration" ? 185000 : 92000) +
    input.vendorCount * 11500 +
    input.apiSurfaceCount * 4200;
  const steadyStateAnnualSavings = feeDelta + fixedVendorSavings + workingCapitalRelease;
  const firstYearNetSavings = steadyStateAnnualSavings - migrationCost;

  return {
    currentAnnualCost,
    modeledOmsAnnualCost,
    feeDelta,
    fixedVendorSavings,
    workingCapitalRelease,
    currentComplexityScore,
    modeledOmsComplexityScore,
    integrationComplexityReduction,
    migrationCost,
    firstYearNetSavings,
    steadyStateAnnualSavings,
    lowCaseSavings: firstYearNetSavings * 0.62,
    highCaseSavings: firstYearNetSavings * 1.28,
    assumptions: [
      "Polygon OMS platform pricing is not public; OMS cost is modeled as an orchestration placeholder plus public Polygon network transaction cost signal.",
      "Current stack fees use a blended point-solution model based on published competitor fee signals and corridor variability.",
      "Working-capital release assumes stablecoin settlement reduces liquidity drag versus multi-day fiat settlement.",
      "No salary, headcount, or developer-cost savings are included by default because team costs vary heavily by market and hiring model.",
    ],
  };
}

export function generateRecommendation(rawInput: Partial<StudioInput>): Recommendation {
  const input = normalizeInput(rawInput);
  const useCase = getUseCase(input.useCaseId);
  const selectedModules = modules.filter((module) =>
    useCase.requiredModules.includes(module.id),
  );
  const costModel = calculateCostModel(input);
  const playbook = selectPlaybook(input.useCaseId, input.mode);

  return {
    title:
      input.mode === "launch"
        ? `Launch ${useCase.name} on Polygon OMS`
        : `Modernize ${useCase.name} with Polygon OMS`,
    narrative:
      input.mode === "launch"
        ? `${useCase.headline} The studio packages wallets, ramps, compliance, stablecoin settlement, and chain operations as a launch blueprint instead of a vendor scavenger hunt.`
        : `${useCase.headline} The studio maps the existing vendor mesh into a phased Polygon OMS architecture while keeping regulated partners and ledgers that should stay in place.`,
    depthMoment:
      input.mode === "launch"
        ? `A new team avoids stitching ${Math.max(input.vendorCount - 4, 5)} point providers before product-market fit and can pitch a launch path with controls, cost ranges, and corridor assumptions already attached.`
        : `Your current stack has ${input.vendorCount} vendors, ${input.apiSurfaceCount} API surfaces, ${input.reconciliationFeeds} reconciliation feeds, and ${input.complianceHandoffs} compliance handoffs. Polygon OMS reduces this to one orchestration layer plus retained regulated partners.`,
    modules: selectedModules,
    architecture: buildArchitecture(input, selectedModules),
    costModel,
    compliance: controls,
    playbook,
    battlecards: buildBattlecards(selectedModules),
  };
}

export function buildExportPitch(rawInput: Partial<StudioInput>) {
  const input = normalizeInput(rawInput);
  const recommendation = generateRecommendation(input);
  const savings = recommendation.costModel.firstYearNetSavings;
  const moduleList = recommendation.modules.map((module) => module.label).join(", ");

  return [
    `# ${recommendation.title}`,
    "",
    recommendation.narrative,
    "",
    `## Depth Moment`,
    recommendation.depthMoment,
    "",
    `## OMS Modules`,
    moduleList,
    "",
    `## First-Year Savings Model`,
    `Modeled first-year net savings: ${formatMoney(savings)}.`,
    `Steady-state annual savings: ${formatMoney(recommendation.costModel.steadyStateAnnualSavings)}.`,
    `The model excludes salary, headcount, and developer-cost savings by default; integration complexity is shown separately as a non-monetary reduction.`,
    "",
    `## Compliance Story`,
    recommendation.compliance
      .map((control) => `- ${control.label}: ${control.description}`)
      .join("\n"),
    "",
    `## Source Caveat`,
    `Polygon OMS platform pricing is early-access/custom. This pitch uses public competitor pricing signals, public Polygon network transaction cost signals, and scenario modeling rather than pretending exact OMS quotes are public.`,
  ].join("\n");
}

export function getSources() {
  return pricing;
}

export function formatMoney(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
}

function selectPlaybook(useCaseId: string, mode: string): MigrationPlaybook {
  if (mode === "launch") {
    return {
      id: "new-launch",
      name: "New Product Launch",
      retained: ["Core product logic", "Customer UX", "Existing compliance policy"],
      replaced: ["Vendor discovery cycles", "Manual stablecoin treasury operations"],
      wrapped: ["Identity vendor", "Local payout partner", "Fraud/risk provider"],
      phases: [
        "Pick corridors, assets, wallet policy, and risk controls.",
        "Prototype OMS settlement with sandbox wallets, mocked KYC, and test payouts.",
        "Pilot a limited geography with capped wallet and payout limits.",
        "Scale corridors once reconciliation, support, and compliance evidence are proven.",
      ],
    };
  }

  if (useCaseId.includes("payroll")) return playbooks[2];
  if (useCaseId.includes("merchant")) return playbooks[1];
  return playbooks[0];
}

function buildBattlecards(selectedModules: OMSModule[]): Battlecard[] {
  return selectedModules.map((module) => ({
    moduleId: module.id,
    moduleLabel: module.label,
    polygonAngle: module.polygonRole,
    competitors: module.providers.slice(0, 6),
  }));
}

function buildArchitecture(
  input: StudioInput,
  selectedModules: OMSModule[],
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  const useCase = getUseCase(input.useCaseId);
  const nodes: ArchitectureNode[] = [
    {
      id: "customer",
      label: input.mode === "launch" ? "New customer flow" : "Existing product surface",
      group: "current",
      detail: useCase.headline,
    },
    {
      id: "identity",
      label: "KYC/KYB and sanctions gate",
      group: "control",
      detail: "Identity, PEP, adverse media, and policy checks before money movement.",
    },
    {
      id: "oms-core",
      label: "Polygon OMS orchestration",
      group: "oms",
      detail: "One integration for wallets, compliance hooks, ramps, stablecoin settlement, and chain services.",
    },
    {
      id: "settlement",
      label: "Stablecoin settlement",
      group: "oms",
      detail: "USDC/stablecoin movement, treasury routing, fees, and reconciliation events.",
    },
    {
      id: "payout",
      label: "Local fiat payout or wallet balance",
      group: "outcome",
      detail: input.corridors,
    },
    {
      id: "audit",
      label: "Audit, controls, and incident freeze",
      group: "control",
      detail: "Velocity limits, wallet risk, Travel Rule, ledger links, webhook retries, and freeze controls.",
    },
  ];

  if (input.mode === "migration") {
    nodes.unshift({
      id: "fragmented-stack",
      label: `${input.vendorCount} point providers`,
      group: "current",
      detail: `${input.apiSurfaceCount} APIs, ${input.reconciliationFeeds} reconciliation feeds, ${input.complianceHandoffs} compliance handoffs.`,
    });
  }

  selectedModules.slice(0, 5).forEach((module, index) => {
    nodes.push({
      id: `module-${module.id}`,
      label: module.label,
      group: "oms",
      detail: module.polygonRole,
    });
  });

  const edges: ArchitectureEdge[] = [
    { id: "e-customer-identity", source: "customer", target: "identity", label: "onboard" },
    { id: "e-identity-oms", source: "identity", target: "oms-core", label: "approved" },
    { id: "e-oms-settle", source: "oms-core", target: "settlement", label: "route" },
    { id: "e-settle-payout", source: "settlement", target: "payout", label: "settle" },
    { id: "e-oms-audit", source: "oms-core", target: "audit", label: "evidence" },
  ];

  if (input.mode === "migration") {
    edges.unshift({
      id: "e-fragmented-customer",
      source: "fragmented-stack",
      target: "customer",
      label: "current",
    });
  }

  selectedModules.slice(0, 5).forEach((module) => {
    edges.push({
      id: `e-oms-${module.id}`,
      source: "oms-core",
      target: `module-${module.id}`,
      label: "module",
    });
  });

  return { nodes, edges };
}
