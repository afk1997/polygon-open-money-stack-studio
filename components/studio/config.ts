import type { StudioMode } from "@/lib/types";

export type RequirementId =
  | "wallet-balances"
  | "cash-in"
  | "cash-out"
  | "cross-border"
  | "multi-currency"
  | "merchant-settlement"
  | "agent-payments"
  | "dedicated-chain"
  | "settlement-chain"
  | "identity"
  | "card-issuing"
  | "treasury-yield";

export type ComplianceId =
  | "kyc-kyb"
  | "sanctions"
  | "kyt"
  | "travel-rule"
  | "velocity-limits"
  | "audit-logs"
  | "freeze-controls";

export type IntakeStepId = "product" | "flow" | "assumptions" | "providers";

export const intakeSteps: Array<{ id: IntakeStepId; label: string }> = [
  { id: "product", label: "Product" },
  { id: "flow", label: "Flow" },
  { id: "assumptions", label: "Assumptions" },
  { id: "providers", label: "Providers" },
];

export const requirementOptions: Array<{
  id: RequirementId;
  label: string;
  detail: string;
  modules: string[];
}> = [
  {
    id: "wallet-balances",
    label: "Wallet balances",
    detail: "User accounts, wallet policy, and ledger events.",
    modules: ["wallet-infra", "stablecoin-orchestration"],
  },
  {
    id: "cash-in",
    label: "Cash-in",
    detail: "Bank, card, or local methods into stablecoin rails.",
    modules: ["ramps", "stablecoin-orchestration"],
  },
  {
    id: "cash-out",
    label: "Cash-out",
    detail: "Stablecoin settlement into local fiat endpoints.",
    modules: ["ramps", "cross-border"],
  },
  {
    id: "cross-border",
    label: "Cross-border payout",
    detail: "Corridor routing, settlement timing, and payout state.",
    modules: ["cross-border", "stablecoin-orchestration"],
  },
  {
    id: "multi-currency",
    label: "Multi-currency support",
    detail: "Multiple settlement currencies, corridor FX, and payout balance handling.",
    modules: ["stablecoin-orchestration", "cross-border"],
  },
  {
    id: "merchant-settlement",
    label: "Merchant settlement",
    detail: "Stablecoin acceptance with fiat settlement choices.",
    modules: ["stablecoin-orchestration", "blockchain-integration"],
  },
  {
    id: "agent-payments",
    label: "Agent payments",
    detail: "Bounded wallets, API settlement, and spend limits.",
    modules: ["wallet-infra", "crosschain", "blockchain-integration"],
  },
  {
    id: "dedicated-chain",
    label: "Dedicated chain",
    detail: "Institution-owned chain or appchain settlement path.",
    modules: ["cdk", "crosschain", "blockchain-integration"],
  },
  {
    id: "settlement-chain",
    label: "Settlement chain",
    detail: "Compare Polygon PoS/CDK against Base, Solana, Stellar, Tron, and other rails.",
    modules: ["settlement-chain"],
  },
  {
    id: "identity",
    label: "Identity credentials",
    detail: "Reusable credentials, KYC/KYB handoff, and verification cost control.",
    modules: ["identity", "compliance-security"],
  },
  {
    id: "card-issuing",
    label: "Card issuing",
    detail: "Debit/prepaid cards, interchange economics, and BaaS dependencies.",
    modules: ["card-issuing"],
  },
  {
    id: "treasury-yield",
    label: "Yield / treasury",
    detail: "Idle bridged TVL, treasury yield, and chain revenue strategy.",
    modules: ["yield-treasury"],
  },
];

export const complianceOptions: Array<{
  id: ComplianceId;
  label: string;
  detail: string;
}> = [
  { id: "kyc-kyb", label: "KYC / KYB", detail: "Identity and business verification before movement." },
  { id: "sanctions", label: "Sanctions screening", detail: "Screen users, wallets, and counterparties." },
  { id: "kyt", label: "Wallet risk / KYT", detail: "Onchain exposure and transaction monitoring." },
  { id: "travel-rule", label: "Travel Rule", detail: "Required data sharing for regulated corridors." },
  { id: "velocity-limits", label: "Velocity limits", detail: "Policy caps by user, market, asset, or payout rail." },
  { id: "audit-logs", label: "Audit logs", detail: "Ledger links, retries, state changes, and evidence." },
  { id: "freeze-controls", label: "Freeze controls", detail: "Incident stops for risky wallets or payout flows." },
];

export const defaultRequirementsByUseCase: Record<string, RequirementId[]> = {
  "neobank-dollar-account": ["wallet-balances", "cash-in", "cash-out", "cross-border", "settlement-chain", "identity", "card-issuing", "treasury-yield"],
  "remittance-app": ["cash-in", "cash-out", "cross-border", "settlement-chain", "identity"],
  "global-payroll": ["wallet-balances", "cross-border", "cash-out", "settlement-chain", "identity"],
  "merchant-settlement": ["merchant-settlement", "cash-out", "cross-border", "settlement-chain", "card-issuing"],
  "marketplace-payouts": ["wallet-balances", "cash-out", "cross-border", "settlement-chain", "identity", "card-issuing"],
  "agentic-payments": ["wallet-balances", "agent-payments", "cross-border", "settlement-chain", "identity"],
  "gaming-economy": ["wallet-balances", "cash-out", "agent-payments", "settlement-chain", "identity"],
  "institutional-cdk": ["dedicated-chain", "cross-border", "merchant-settlement", "settlement-chain", "treasury-yield", "identity"],
};

export const defaultCompliance: ComplianceId[] = [
  "kyc-kyb",
  "sanctions",
  "kyt",
  "audit-logs",
];

export const complianceControlIdsByChoice: Record<ComplianceId, string[]> = {
  "kyc-kyb": ["kyc"],
  sanctions: ["sanctions"],
  kyt: ["wallet-risk"],
  "travel-rule": ["travel-rule"],
  "velocity-limits": ["velocity"],
  "audit-logs": ["ledger", "webhooks"],
  "freeze-controls": ["incident-freeze"],
};

const benchmarkByModule: Record<string, string[]> = {
  "wallet-infra": ["circle-wallets", "coinbase-cdp"],
  crosschain: ["chainlink-ccip"],
  "stablecoin-orchestration": ["bridge", "bvnk"],
  ramps: ["moonpay", "ramp-network"],
  "cross-border": ["wise-platform", "airwallex"],
  "blockchain-integration": ["alchemy"],
  cdk: ["avacloud"],
  "compliance-security": ["chainalysis", "trm"],
  "settlement-chain": ["base", "solana", "stellar", "tron"],
  "yield-treasury": ["morpho", "aave"],
  "card-issuing": ["stripe-issuing", "marqeta"],
  identity: ["sumsub-identity", "persona-identity"],
};

export function buildBenchmarkProviderIds(moduleIds: string[]) {
  return Array.from(
    new Set(moduleIds.flatMap((moduleId) => benchmarkByModule[moduleId] ?? [])),
  );
}

export function complianceControlIdsFromChoices(compliance: ComplianceId[]) {
  return Array.from(
    new Set(compliance.flatMap((choice) => complianceControlIdsByChoice[choice] ?? [])),
  );
}

export function requiredModulesFromChoices(
  useCaseModules: string[],
  requirements: RequirementId[],
  compliance: ComplianceId[],
) {
  const modules = new Set(useCaseModules);
  for (const requirement of requirements) {
    const option = requirementOptions.find((item) => item.id === requirement);
    option?.modules.forEach((moduleId) => modules.add(moduleId));
  }
  if (compliance.length > 0) modules.add("compliance-security");
  return Array.from(modules);
}

export function modeLabel(mode: StudioMode) {
  return mode === "launch" ? "Launch New" : "Optimize Existing";
}
