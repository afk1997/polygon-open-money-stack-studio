import { controls, getUseCase, modules, playbooks, pricing } from "./data";
import {
  complianceControlIdsFromContext,
  mergeUniqueIds,
  moduleIdsFromContext,
} from "./input-context";
import type {
  ArchitectureEdge,
  ArchitectureNode,
  Battlecard,
  CostConfidence,
  CostModel,
  MigrationPlaybook,
  OMSModule,
  Provider,
  ProviderCostLine,
  Recommendation,
  StudioInput,
} from "./types";

const POLYGON_NETWORK_TX_COST_USD = 0.002;
const TREASURY_YIELD = 0.045;
const FALLBACK_CURRENT_BPS = 92;
const FALLBACK_LAUNCH_BPS = 118;

type ProviderPricingProfile = {
  fixedAnnual?: number;
  fixedMonthly?: number;
  volumeBps?: number;
  transactionFee?: number;
  walletMonthlyFee?: number;
  verificationFee?: number;
  verificationMonthlyShare?: number;
  protocolRevenueShareRate?: number;
  protocolProfitShareRate?: number;
  protocolProfitMarginAssumption?: number;
  protocolRevenueProxyBps?: number;
  freeWallets?: number;
  freeMonthlyTransactions?: number;
  freeMonthlyVerifications?: number;
  confidence?: CostConfidence;
  basis: string;
  note: string;
};

const moduleExposure: Record<string, { volume: number; transactions: number; wallets: number }> = {
  "wallet-infra": { volume: 0, transactions: 0.65, wallets: 1 },
  crosschain: { volume: 0.25, transactions: 0.35, wallets: 0 },
  "stablecoin-orchestration": { volume: 0.55, transactions: 0.45, wallets: 0.15 },
  ramps: { volume: 0.35, transactions: 0.3, wallets: 0 },
  "cross-border": { volume: 0.65, transactions: 0.4, wallets: 0 },
  "blockchain-integration": { volume: 0, transactions: 0.65, wallets: 0 },
  cdk: { volume: 0.12, transactions: 0.4, wallets: 0 },
  "compliance-security": { volume: 0, transactions: 0.55, wallets: 0.2 },
  "settlement-chain": { volume: 0, transactions: 1, wallets: 0 },
  "yield-treasury": { volume: 0.4, transactions: 0, wallets: 0 },
  "card-issuing": { volume: 0.6, transactions: 0.4, wallets: 0 },
  identity: { volume: 0, transactions: 0, wallets: 1 },
};

const providerPricingProfiles: Record<string, ProviderPricingProfile> = {
  "circle-wallets": {
    walletMonthlyFee: 0.025,
    freeWallets: 1000,
    confidence: "published",
    basis: "MAW tier model",
    note: "Modeled at the midpoint of Circle's public MAW range after the free allowance.",
  },
  "coinbase-cdp": {
    transactionFee: 0.005,
    freeMonthlyTransactions: 5000,
    confidence: "published",
    basis: "wallet operation fee",
    note: "Modeled from public wallet-operation allowance and overage pricing.",
  },
  crossmint: {
    walletMonthlyFee: 0.05,
    freeWallets: 1000,
    confidence: "published",
    basis: "wallet MAW overage",
    note: "Modeled from public wallet allowance and monthly-active-wallet signal.",
  },
  dynamic: {
    fixedMonthly: 249,
    confidence: "published",
    basis: "growth plan",
    note: "Modeled from the public growth plan rather than enterprise custom pricing.",
  },
  privy: {
    fixedMonthly: 299,
    walletMonthlyFee: 0.018,
    freeWallets: 499,
    confidence: "published",
    basis: "core plan plus MAW overage",
    note: "Modeled from public tier signals with MAW overage. Strategic note: Privy moved into Stripe/Bridge's stablecoin-wallet orbit in 2025, so ownership matters in vendor strategy.",
  },
  turnkey: {
    transactionFee: 0.015,
    freeMonthlyTransactions: 25,
    confidence: "published",
    basis: "signature pricing",
    note: "Modeled from public free signature allowance and per-signature style pricing.",
  },
  fireblocks: {
    fixedAnnual: 18000,
    confidence: "published",
    basis: "starter/custom annual signal",
    note: "Modeled at the lower published institutional annual signal; larger programs can quote higher.",
  },
  dfns: {
    fixedAnnual: 65000,
    confidence: "custom",
    basis: "enterprise WaaS estimate",
    note: "Custom-priced wallet infrastructure modeled as an annual enterprise platform line.",
  },
  fordefi: {
    fixedAnnual: 55000,
    confidence: "custom",
    basis: "MPC platform estimate",
    note: "Custom-priced MPC wallet platform modeled as an annual enterprise line.",
  },
  "chainlink-ccip": {
    volumeBps: 10,
    transactionFee: 0.03,
    confidence: "published",
    basis: "gas, network fee, message fee",
    note: "Modeled at a 10 bps token-transfer network-fee signal plus per-message gas/message cost; exact routes vary.",
  },
  layerzero: {
    transactionFee: 0.025,
    volumeBps: 6,
    confidence: "public-signal",
    basis: "executor/DVN/gas quote",
    note: "Modeled at a 6 bps public-signal token-transfer cost plus executor and destination gas fees.",
  },
  wormhole: {
    transactionFee: 0.025,
    volumeBps: 3,
    confidence: "public-signal",
    basis: "relayer and gas quote",
    note: "Modeled as dynamic relayer and destination-gas route cost.",
  },
  across: {
    volumeBps: 9,
    confidence: "public-signal",
    basis: "relayer and LP fees",
    note: "Modeled as a liquidity-route bps cost; exact quote changes by route.",
  },
  bridge: {
    volumeBps: 70,
    fixedMonthly: 5000,
    confidence: "published",
    basis: "stablecoin API plus FX spread",
    note: "Modeled at 70 bps as a fair midpoint below Bridge's disclosed up-to-1% FX spread, plus platform access.",
  },
  bvnk: {
    volumeBps: 70,
    fixedMonthly: 3000,
    confidence: "public-signal",
    basis: "stablecoin payment provider range",
    note: "Modeled within the published market-guide provider-fee range.",
  },
  zerohash: {
    volumeBps: 5,
    fixedMonthly: 4000,
    confidence: "published",
    basis: "issuer schedule plus platform estimate",
    note: "Uses published stablecoin issuer fee signal plus a modeled platform line.",
  },
  "stripe-stablecoins": {
    volumeBps: 150,
    confidence: "public-signal",
    basis: "stablecoin payment acceptance",
    note: "Modeled from public stablecoin payment acceptance fee signals where available.",
  },
  moonpay: {
    volumeBps: 350,
    confidence: "published",
    basis: "ramp transaction fee",
    note: "Modeled below the disclosed maximum direct fee and route-dependent cards range.",
  },
  "ramp-network": {
    volumeBps: 220,
    confidence: "published",
    basis: "bank/card ramp blend",
    note: "Modeled as a bank/card blended ramp cost inside the public fee range.",
  },
  transak: {
    volumeBps: 140,
    confidence: "public-signal",
    basis: "route-dependent ramp fee",
    note: "Modeled from public off-ramp and route-dependent on-ramp signals.",
  },
  "coinbase-onramp": {
    volumeBps: 70,
    confidence: "public-signal",
    basis: "USDC/onramp route signal",
    note: "Modeled conservatively because some no-fee USDC paths require approval or context.",
  },
  onramper: {
    fixedMonthly: 599,
    volumeBps: 35,
    confidence: "published",
    basis: "aggregator SaaS plus route fee",
    note: "Modeled from public premium plan plus partner route-fee pass-through.",
  },
  "wise-platform": {
    volumeBps: 55,
    confidence: "published",
    basis: "cross-border payout blend",
    note: "Modeled as a blended international payout fee; exact corridors vary.",
  },
  airwallex: {
    volumeBps: 45,
    confidence: "published",
    basis: "global account/payout blend",
    note: "Modeled as a public pricing-page payout and FX blend; platform terms vary.",
  },
  nium: {
    volumeBps: 55,
    fixedMonthly: 2500,
    confidence: "custom",
    basis: "global payout network",
    note: "Custom payout network modeled by corridor-volume blend.",
  },
  thunes: {
    volumeBps: 60,
    fixedMonthly: 2500,
    confidence: "custom",
    basis: "payout network",
    note: "Custom-priced payout network modeled as route-dependent bps plus platform access.",
  },
  alchemy: {
    fixedMonthly: 199,
    confidence: "published",
    basis: "developer platform plan",
    note: "Modeled from public SaaS plan signal; enterprise and rollups differ.",
  },
  quicknode: {
    fixedMonthly: 199,
    confidence: "published",
    basis: "RPC plan",
    note: "Modeled from public RPC plan signal.",
  },
  infura: {
    fixedMonthly: 135,
    confidence: "published",
    basis: "RPC plan",
    note: "Modeled from public RPC SaaS plan signal.",
  },
  chainstack: {
    fixedMonthly: 149,
    confidence: "published",
    basis: "node infrastructure plan",
    note: "Modeled from public node infrastructure tiers.",
  },
  "polygon-cdk": {
    fixedAnnual: 0,
    confidence: "custom",
    basis: "Polygon CDK custom",
    note: "Kept at zero in the current-stack side because Polygon CDK belongs in the OMS-side architecture.",
  },
  avacloud: {
    fixedMonthly: 1999,
    confidence: "published",
    basis: "mainnet starter plan",
    note: "Modeled from the public mainnet monthly plan signal.",
  },
  "op-stack": {
    fixedAnnual: 96000,
    protocolRevenueShareRate: 0.025,
    protocolProfitShareRate: 0.15,
    protocolProfitMarginAssumption: 0.4,
    protocolRevenueProxyBps: 12,
    confidence: "public-signal",
    basis: "open source plus service/infra",
    note: "Open-source plus managed service/infra. Adds a proxy for Superchain-style 2.5% revenue or 15% profit share economics so Polygon CDK's no-rent-seeking angle is visible.",
  },
  "arbitrum-orbit": {
    fixedAnnual: 96000,
    protocolRevenueShareRate: 0.1,
    protocolRevenueProxyBps: 12,
    confidence: "public-signal",
    basis: "open framework plus service/infra",
    note: "Open framework plus managed service/infra. Adds a proxy for independent Orbit net protocol revenue share so Polygon CDK can be compared on rent-seeking as well as infra cost.",
  },
  chainalysis: {
    fixedAnnual: 75000,
    confidence: "custom",
    basis: "KYT platform",
    note: "Custom-priced blockchain analytics modeled as an annual platform line.",
  },
  trm: {
    fixedAnnual: 75000,
    confidence: "custom",
    basis: "KYT platform",
    note: "Custom-priced blockchain intelligence modeled as an annual platform line.",
  },
  elliptic: {
    fixedAnnual: 65000,
    confidence: "custom",
    basis: "KYT platform",
    note: "Custom-priced analytics modeled as an annual platform line.",
  },
  notabene: {
    fixedAnnual: 45000,
    confidence: "custom",
    basis: "Travel Rule platform",
    note: "Custom-priced Travel Rule tooling modeled as an annual platform line.",
  },
  alloy: {
    fixedAnnual: 45000,
    confidence: "custom",
    basis: "identity decisioning platform",
    note: "Custom-priced decisioning modeled as an annual platform line.",
  },
  persona: {
    fixedMonthly: 250,
    verificationFee: 1.2,
    verificationMonthlyShare: 0.08,
    freeMonthlyVerifications: 100,
    confidence: "public-signal",
    basis: "identity plan plus per-verification",
    note: "Modeled as platform access plus per-verification usage; fixed-only modeling understates KYC cost at scale.",
  },
  sumsub: {
    fixedMonthly: 299,
    verificationFee: 1.5,
    verificationMonthlyShare: 0.08,
    freeMonthlyVerifications: 50,
    confidence: "published",
    basis: "compliance plan plus per-verification",
    note: "Modeled as platform access plus blended per-verification usage; fixed-only modeling understates KYC cost at scale.",
  },
  coinme: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon OMS fiat-ramp component",
    note: "Polygon-owned/integrated OMS component after the Coinme transaction; not modeled as a separate point-solution vendor cost.",
  },
  agglayer: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon OMS interoperability",
    note: "Polygon-native interoperability layer for CDK and Polygon-connected liquidity; not modeled as a separate competitor cost.",
  },
  "sequence-trails": {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon OMS intents",
    note: "Sequence Trails belongs on the Polygon side of the architecture and is excluded from point-solution cost comparisons.",
  },
  vaultbridge: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon OMS treasury yield",
    note: "Revenue-generating treasury layer rather than a vendor cost line; shown as a Polygon differentiator.",
  },
  "polygon-id": {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon/Privado identity",
    note: "Open-source ZK identity layer; may pair with regulated KYC vendors for initial verification but should not be priced as a per-check point solution.",
  },
  "polygon-id-identity": {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon/Privado identity",
    note: "Reusable identity credential layer on the Polygon side; excludes regulated verification partner fees.",
  },
  "polygon-pos": {
    fixedAnnual: 0,
    transactionFee: 0.002,
    confidence: "published",
    basis: "Polygon network gas",
    note: "Public Polygon network transaction cost signal used for settlement-chain comparison.",
  },
  "polygon-zkevm": {
    fixedAnnual: 0,
    transactionFee: 0.015,
    confidence: "public-signal",
    basis: "Polygon zkEVM gas",
    note: "Modeled as a Polygon ZK rollup gas signal; exact cost depends on batch and network conditions.",
  },
  base: {
    transactionFee: 0.09,
    confidence: "public-signal",
    basis: "Base network gas",
    note: "Modeled as a public-signal L2 chain comparison line; actual gas varies by congestion and calldata.",
  },
  "arbitrum-one": {
    transactionFee: 0.09,
    confidence: "public-signal",
    basis: "Arbitrum network gas",
    note: "Modeled as an optimistic-rollup settlement comparison line; actual gas varies by transaction shape.",
  },
  optimism: {
    transactionFee: 0.09,
    confidence: "public-signal",
    basis: "Optimism network gas",
    note: "Modeled as an OP Mainnet settlement comparison line; chain economics should also include Superchain revenue-share context where applicable.",
  },
  solana: {
    transactionFee: 0.0015,
    confidence: "public-signal",
    basis: "Solana base plus priority fees",
    note: "Modeled with a small priority-fee allowance above the base fee; non-EVM rebuild costs are not included.",
  },
  stellar: {
    transactionFee: 0.0008,
    confidence: "published",
    basis: "Stellar base fee",
    note: "Payment-native chain comparison line using low published base-fee signal plus practical fee buffer.",
  },
  tron: {
    transactionFee: 2.5,
    confidence: "public-signal",
    basis: "Tron USDT transfer energy/bandwidth",
    note: "Modeled from public-signal USDT transfer cost ranges on Tron; energy rental and bandwidth can change the effective cost.",
  },
  "avalanche-c": {
    transactionFee: 0.2,
    confidence: "public-signal",
    basis: "Avalanche C-Chain gas",
    note: "Modeled as dynamic C-Chain gas, separate from AvaCloud/L1 deployment commercials.",
  },
  "bnb-chain": {
    transactionFee: 0.006,
    confidence: "public-signal",
    basis: "BNB Chain gas",
    note: "Modeled as a low-cost EVM settlement chain with region-specific stablecoin distribution advantages.",
  },
  "ethereum-mainnet": {
    transactionFee: 0.5,
    confidence: "public-signal",
    basis: "Ethereum L1 gas",
    note: "Modeled at a modest L1 gas scenario; mainnet can be materially higher under congestion.",
  },
  sui: {
    transactionFee: 0.003,
    confidence: "public-signal",
    basis: "Sui gas",
    note: "Modeled as a low-fee non-EVM settlement chain; Move rebuild costs are not included.",
  },
  aptos: {
    transactionFee: 0.005,
    confidence: "public-signal",
    basis: "Aptos gas",
    note: "Modeled as a low-fee non-EVM settlement chain; Move rebuild costs are not included.",
  },
  morpho: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "yield protocol",
    note: "Treasury yield layer; protocol fees come from generated yield, not payment volume cost.",
  },
  aave: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "lending market",
    note: "Treasury yield layer; reserve-factor economics affect yield, not direct payment movement cost.",
  },
  compound: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "lending market",
    note: "Treasury yield layer modeled as zero vendor cost in the savings comparison.",
  },
  spark: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "lending market",
    note: "Treasury yield layer backed by governance-set rates; not a direct payment-rail cost.",
  },
  yearn: {
    fixedAnnual: 0,
    confidence: "published",
    basis: "yield aggregator",
    note: "Yield aggregator fees are taken from generated yield, not gross money-movement volume.",
  },
  pendle: {
    fixedAnnual: 0,
    confidence: "published",
    basis: "yield trading",
    note: "Yield trading fee layer; useful for treasury strategy but not a direct rail cost.",
  },
  "stripe-issuing": {
    transactionFee: 0.1,
    confidence: "published",
    basis: "Stripe Issuing virtual card",
    note: "Modeled from public virtual-card pricing; physical cards and dispute/FX fees vary.",
  },
  marqeta: {
    fixedAnnual: 100000,
    volumeBps: 4,
    confidence: "custom",
    basis: "enterprise issuing platform",
    note: "Custom enterprise issuing platform modeled with annual minimum plus usage signal.",
  },
  lithic: {
    fixedMonthly: 200,
    transactionFee: 0.08,
    confidence: "custom",
    basis: "card issuing API",
    note: "Startup-friendly issuing API modeled with platform and per-authorization signal; actual terms vary.",
  },
  unit: {
    fixedMonthly: 1000,
    confidence: "custom",
    basis: "BaaS platform",
    note: "Modeled as BaaS platform access; interchange-share economics are not credited as savings.",
  },
  galileo: {
    fixedAnnual: 60000,
    confidence: "custom",
    basis: "processor platform",
    note: "Custom enterprise processor line modeled for neobank card-issuing stacks.",
  },
  column: {
    fixedMonthly: 500,
    confidence: "custom",
    basis: "chartered bank platform",
    note: "Modeled as direct-bank platform access; sponsor-bank economics are outside the OMS fee model.",
  },
  "treasury-prime": {
    fixedMonthly: 3000,
    confidence: "custom",
    basis: "multi-bank BaaS",
    note: "Modeled as BaaS platform access; interchange splits and sponsor-bank fees vary by program.",
  },
  highnote: {
    fixedAnnual: 75000,
    confidence: "custom",
    basis: "issuing plus ledger platform",
    note: "Modern issuing platform modeled as a custom annual platform line.",
  },
  "modern-treasury": {
    fixedMonthly: 2500,
    confidence: "custom",
    basis: "payment ops platform",
    note: "Reconciliation and payment-ops platform that pairs with issuer/bank rails rather than replacing them.",
  },
  "sumsub-identity": {
    fixedMonthly: 299,
    verificationFee: 1.5,
    verificationMonthlyShare: 0.08,
    freeMonthlyVerifications: 50,
    confidence: "published",
    basis: "compliance plan plus per-verification",
    note: "Identity-module version of Sumsub so Polygon ID can be compared against verification vendors directly.",
  },
  "persona-identity": {
    fixedMonthly: 250,
    verificationFee: 1.2,
    verificationMonthlyShare: 0.08,
    freeMonthlyVerifications: 100,
    confidence: "public-signal",
    basis: "identity plan plus per-verification",
    note: "Identity-module version of Persona with per-verification usage modeled.",
  },
  "veriff-identity": {
    fixedMonthly: 99,
    verificationFee: 1.5,
    verificationMonthlyShare: 0.08,
    confidence: "published",
    basis: "KYC plan plus per-verification",
    note: "Modeled as platform access plus blended verification usage.",
  },
  "onfido-identity": {
    fixedAnnual: 60000,
    confidence: "custom",
    basis: "enterprise identity contract",
    note: "Modeled as an enterprise verification contract; per-check economics vary by package.",
  },
  "jumio-identity": {
    fixedAnnual: 145000,
    confidence: "custom",
    basis: "enterprise identity contract",
    note: "Modeled as a premium enterprise verification contract.",
  },
  "civic-identity": {
    walletMonthlyFee: 0.05,
    confidence: "public-signal",
    basis: "active pass model",
    note: "Web3-native reusable-pass model; modeled as low usage cost per active credential/pass event.",
  },
  "alloy-identity": {
    fixedAnnual: 45000,
    confidence: "custom",
    basis: "identity decisioning",
    note: "Decisioning layer on top of underlying verification vendors.",
  },
};

export const defaultInput: StudioInput = {
  mode: "migration",
  useCaseId: "neobank-dollar-account",
  monthlyVolume: 24000000,
  monthlyTransactions: 180000,
  activeWallets: 135000,
  settlementDays: 3,
  vendorCount: 14,
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
    "base",
    "stripe-issuing",
    "sumsub-identity",
  ],
  corridors: "USDC to MXN, BRL, PHP, INR",
};

export function normalizeInput(input: Partial<StudioInput>): StudioInput {
  const useCase = getUseCase(input.useCaseId ?? defaultInput.useCaseId);
  const workflowContext = input.workflowContext?.replace(/\s+/g, " ").trim();
  const contextModuleIds = moduleIdsFromContext(workflowContext ?? "");
  const contextComplianceControlIds = complianceControlIdsFromContext(workflowContext ?? "");
  const rawRequiredModuleIds = input.requiredModuleIds !== undefined
    ? mergeUniqueIds(input.requiredModuleIds, contextModuleIds)
    : contextModuleIds.length > 0
      ? contextModuleIds
      : undefined;
  const rawComplianceControlIds = input.complianceControlIds !== undefined
    ? mergeUniqueIds(input.complianceControlIds, contextComplianceControlIds)
    : contextComplianceControlIds.length > 0
      ? contextComplianceControlIds
      : undefined;
  const requiredModuleIds = rawRequiredModuleIds
    ? uniqueKnownIds(rawRequiredModuleIds, modules.map((module) => module.id))
    : undefined;
  const complianceControlIds = rawComplianceControlIds
    ? uniqueKnownIds(rawComplianceControlIds, controls.map((control) => control.id))
    : undefined;
  const complianceHandoffs = input.complianceHandoffs !== undefined
    ? Math.max(input.complianceHandoffs, complianceControlIds?.length ?? 0)
    : complianceControlIds !== undefined
      ? complianceControlIds.length
      : defaultInput.complianceHandoffs;

  return {
    ...defaultInput,
    useCaseId: useCase.id,
    monthlyVolume: input.monthlyVolume ?? useCase.defaultVolume,
    monthlyTransactions: input.monthlyTransactions ?? useCase.defaultTransactions,
    activeWallets: input.activeWallets ?? useCase.defaultWallets,
    corridors: input.corridors ?? useCase.defaultCorridors,
    ...input,
    complianceHandoffs,
    requiredModuleIds,
    complianceControlIds,
    workflowContext: workflowContext || undefined,
  };
}

export function calculateCostModel(rawInput: Partial<StudioInput>): CostModel {
  const input = normalizeInput(rawInput);
  const providerCostLines = buildProviderCostLines(input);
  const polygonStackItemsPriced = getSelectedPolygonStackItems(input.selectedProviderIds).map(
    (provider) => provider.name,
  );
  const selectedProviderCount = providerCostLines.length;
  const usesProviderModel = selectedProviderCount > 0;
  const effectiveVendorCount = usesProviderModel ? selectedProviderCount : input.vendorCount;
  const modeledOrchestrationBps = input.mode === "migration" ? 34 : 42;
  const fallbackCurrentBps = input.mode === "migration" ? FALLBACK_CURRENT_BPS : FALLBACK_LAUNCH_BPS;
  const selectedProviderFixedCost = providerCostLines.reduce(
    (total, line) => total + line.annualFixedCost,
    0,
  );
  const selectedProviderVariableCost = providerCostLines.reduce(
    (total, line) => total + line.annualVariableCost,
    0,
  );
  const selectedProviderAnnualCost =
    selectedProviderFixedCost + selectedProviderVariableCost;
  const fallbackCurrentAnnualVariable =
    input.monthlyVolume * 12 * (fallbackCurrentBps / 10000) * (input.mode === "migration" ? 1 : 0.72);
  const modeledOmsVariable =
    input.monthlyVolume * 12 * (modeledOrchestrationBps / 10000);
  const publicNetworkSignal =
    input.monthlyTransactions * 12 * POLYGON_NETWORK_TX_COST_USD;
  const operationalOverheadAnnualCost =
    input.apiSurfaceCount * 4500 +
    input.reconciliationFeeds * 12000 +
    input.complianceHandoffs * 6000;
  const fallbackCurrentAnnualFixed =
    Math.max(input.vendorCount, 1) * 3250 * 12 +
    input.apiSurfaceCount * 7400 +
    input.reconciliationFeeds * 18200;
  const currentAnnualVariable = usesProviderModel
    ? selectedProviderVariableCost
    : fallbackCurrentAnnualVariable;
  const currentAnnualFixed = usesProviderModel
    ? selectedProviderFixedCost + operationalOverheadAnnualCost
    : fallbackCurrentAnnualFixed;
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
    effectiveVendorCount * 3 +
    input.apiSurfaceCount * 2 +
    input.reconciliationFeeds * 4 +
    input.complianceHandoffs * 3;
  const modeledOmsComplexityScore = 12 + Math.max(input.complianceHandoffs - 2, 0) * 2;
  const integrationComplexityReduction = Math.round(
    Math.max(0, 1 - modeledOmsComplexityScore / Math.max(currentComplexityScore, 1)) * 100,
  );
  const steadyStateAnnualSavings = feeDelta + fixedVendorSavings + workingCapitalRelease;
  const migrationCost = 0;
  const firstYearNetSavings = steadyStateAnnualSavings;

  return {
    currentAnnualCost,
    modeledOmsAnnualCost,
    selectedProviderAnnualCost,
    selectedProviderFixedCost,
    selectedProviderVariableCost,
    selectedProviderCount,
    providerCostLines,
    polygonStackAnnualCost: 0,
    polygonStackItemsPriced,
    operationalOverheadAnnualCost: usesProviderModel ? operationalOverheadAnnualCost : 0,
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
      usesProviderModel
        ? "Current stack fees are computed from selected point-solution providers. Provider volumes are allocated by OMS area so selecting multiple vendors in one area shares that route volume instead of double-counting full volume."
        : "Current stack fees use a blended point-solution model based on published competitor fee signals and corridor variability.",
      "Provider pricing lines are directional: published prices use public tables, public-signal lines use public ranges or fee structures, and custom-priced vendors use conservative scenario estimates.",
      "Working-capital release assumes stablecoin settlement reduces liquidity drag versus multi-day fiat settlement.",
      "No salary, headcount, or developer-cost savings are included by default because team costs vary heavily by market and hiring model.",
      "Sequence, Coinme, Agglayer, Sequence Trails, Vaultbridge, Polygon ID, Polygon PoS, and Polygon CDK are rendered as Polygon OMS-side capabilities, not point-solution competitors.",
      "Polygon-owned/integrated components are excluded from current-stack competitor cost lines. External regulated partners such as KYC, banking, issuing, and local payout providers remain priced when selected.",
      "Yield and treasury protocols are treated as strategic upside or yield-share mechanisms, not direct money-movement cost lines.",
    ],
  };
}

export function generateRecommendation(rawInput: Partial<StudioInput>): Recommendation {
  const input = normalizeInput(rawInput);
  const useCase = getUseCase(input.useCaseId);
  const selectedModules = selectModulesForInput(input, useCase.requiredModules);
  const selectedComplianceControls = selectComplianceControls(input);
  const costModel = calculateCostModel(input);
  const effectiveVendorCount = costModel.selectedProviderCount || input.vendorCount;
  const playbook = selectPlaybook(input.useCaseId, input.mode);
  const contextSentence = input.workflowContext
    ? ` Context applied: ${truncate(input.workflowContext, 180)}`
    : "";

  return {
    title:
      input.mode === "launch"
        ? `Launch ${useCase.name} on Polygon OMS`
        : `Optimize ${useCase.name} with Polygon OMS`,
    narrative:
      input.mode === "launch"
        ? `${useCase.headline} The studio packages wallets, ramps, compliance, stablecoin settlement, and chain operations as a launch blueprint instead of a vendor scavenger hunt.${contextSentence}`
        : `${useCase.headline} The studio maps the existing vendor mesh into a phased Polygon OMS architecture while keeping regulated partners and ledgers that should stay in place.${contextSentence}`,
    depthMoment:
      input.mode === "launch"
        ? `A new team avoids stitching ${Math.max(effectiveVendorCount - 4, 5)} point providers before product-market fit and can pitch a launch path with controls, cost ranges, and corridor assumptions already attached.`
        : `Your current selected stack has ${effectiveVendorCount} providers, ${input.apiSurfaceCount} API surfaces, ${input.reconciliationFeeds} reconciliation feeds, and ${input.complianceHandoffs} compliance handoffs. Polygon OMS reduces this to one orchestration layer plus retained regulated partners.`,
    modules: selectedModules,
    architecture: buildArchitecture(input, selectedModules),
    costModel,
    compliance: selectedComplianceControls,
    playbook,
    battlecards: buildBattlecards(selectedModules),
  };
}

export function buildExportPitch(rawInput: Partial<StudioInput>) {
  const input = normalizeInput(rawInput);
  const recommendation = generateRecommendation(input);
  const savings = recommendation.costModel.firstYearNetSavings;
  const moduleList = recommendation.modules.map((module) => module.label).join(", ");
  const providerLines = recommendation.costModel.providerCostLines
    .slice()
    .sort((a, b) => b.annualCost - a.annualCost)
    .slice(0, 10)
    .map(
      (line) =>
        `- ${line.providerName}: ${formatMoney(line.annualCost)} annual modeled cost (${line.pricingBasis}, ${line.confidence}).`,
    );

  return [
    `# ${recommendation.title}`,
    "",
    recommendation.narrative,
    "",
    input.workflowContext ? `## User Context\n${input.workflowContext}\n` : "",
    `## Depth Moment`,
    recommendation.depthMoment,
    "",
    `## OMS Modules`,
    moduleList,
    "",
    `## First-Year Savings Model`,
    `Modeled first-year net savings: ${formatMoney(savings)}.`,
    `Steady-state annual savings: ${formatMoney(recommendation.costModel.steadyStateAnnualSavings)}.`,
    recommendation.costModel.selectedProviderCount > 0
      ? `Current stack cost is computed from ${recommendation.costModel.selectedProviderCount} selected point-solution providers: ${formatMoney(recommendation.costModel.selectedProviderAnnualCost)} provider cost plus ${formatMoney(recommendation.costModel.operationalOverheadAnnualCost)} integration/reconciliation overhead.`
      : `Current stack cost uses the blended scenario model because no point-solution providers were selected.`,
    `The model excludes salary, headcount, and developer-cost savings by default; integration complexity is shown separately as a non-monetary reduction.`,
    `Polygon-owned/integrated pieces such as Sequence, Coinme, Agglayer, Polygon ID, Vaultbridge, Polygon PoS, and Polygon CDK are treated as OMS-side capabilities, not competitor cost lines.`,
    "",
    `## Selected Provider Cost Lines`,
    providerLines.length > 0
      ? providerLines.join("\n")
      : "- No selected provider lines. Add providers in the point-solution market to compute this section.",
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

function buildProviderCostLines(input: StudioInput): ProviderCostLine[] {
  const selectedIds = new Set(input.selectedProviderIds);
  const selected = modules.flatMap((module) =>
    module.providers
      .filter((provider) => selectedIds.has(provider.id) && !provider.polygonOwned)
      .map((provider) => ({ module, provider })),
  );
  const selectedByModule = selected.reduce<Record<string, number>>((counts, item) => {
    counts[item.module.id] = (counts[item.module.id] ?? 0) + 1;
    return counts;
  }, {});

  return selected.map(({ module, provider }) => {
    const profile = providerPricingProfiles[provider.id] ?? fallbackProfile(module.id, provider);
    const exposure = moduleExposure[module.id] ?? { volume: 0.25, transactions: 0.25, wallets: 0.25 };
    const moduleProviderCount = Math.max(selectedByModule[module.id] ?? 1, 1);
    const allocatedMonthlyVolume =
      (input.monthlyVolume * exposure.volume) / moduleProviderCount;
    const allocatedMonthlyTransactions =
      (input.monthlyTransactions * exposure.transactions) / moduleProviderCount;
    const allocatedWallets =
      (input.activeWallets * exposure.wallets) / moduleProviderCount;
    const allocatedMonthlyVerifications =
      allocatedWallets * (profile.verificationMonthlyShare ?? 0);
    const annualProtocolRevenueProxy =
      allocatedMonthlyVolume * 12 * ((profile.protocolRevenueProxyBps ?? 0) / 10000);
    const annualProtocolRevenueShare =
      annualProtocolRevenueProxy * (profile.protocolRevenueShareRate ?? 0);
    const annualProtocolProfitShare =
      annualProtocolRevenueProxy *
      (profile.protocolProfitMarginAssumption ?? 0.4) *
      (profile.protocolProfitShareRate ?? 0);
    const annualProtocolShareCost = Math.max(
      annualProtocolRevenueShare,
      annualProtocolProfitShare,
    );
    const annualFixedCost =
      (profile.fixedAnnual ?? 0) + (profile.fixedMonthly ?? 0) * 12;
    const annualVariableCost =
      allocatedMonthlyVolume * 12 * ((profile.volumeBps ?? 0) / 10000) +
      Math.max(allocatedMonthlyTransactions - (profile.freeMonthlyTransactions ?? 0), 0) *
        12 *
        (profile.transactionFee ?? 0) +
      Math.max(allocatedWallets - (profile.freeWallets ?? 0), 0) *
        12 *
        (profile.walletMonthlyFee ?? 0) +
      Math.max(allocatedMonthlyVerifications - (profile.freeMonthlyVerifications ?? 0), 0) *
        12 *
        (profile.verificationFee ?? 0) +
      annualProtocolShareCost;
    const evidence = pricing.find((item) => item.providerId === provider.id);
    const confidence = profile.confidence ?? evidence?.type ?? "modeled";

    return {
      providerId: provider.id,
      providerName: provider.name,
      moduleId: module.id,
      moduleLabel: module.label,
      pricingBasis: profile.basis,
      confidence,
      annualFixedCost,
      annualVariableCost,
      annualCost: annualFixedCost + annualVariableCost,
      calculationNote: [
        profile.note,
        profile.volumeBps
          ? `${profile.volumeBps} bps applied to ${Math.round(exposure.volume * 100)}% module volume share.`
          : "",
        profile.transactionFee
          ? `${formatUnitCost(profile.transactionFee)} per transaction after monthly allowance.`
          : "",
        profile.walletMonthlyFee
          ? `${formatUnitCost(profile.walletMonthlyFee)} per monthly active wallet after allowance.`
          : "",
        profile.verificationFee
          ? `${formatUnitCost(profile.verificationFee)} per verification; ${Math.round((profile.verificationMonthlyShare ?? 0) * 100)}% of allocated active accounts modeled as monthly verifications.`
          : "",
        annualProtocolShareCost
          ? `${formatMoney(annualProtocolShareCost)} modeled protocol revenue-share proxy from ${profile.protocolRevenueProxyBps} bps of allocated CDK/module volume.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    };
  });
}

function uniqueKnownIds(ids: string[], knownIds: string[]) {
  const known = new Set(knownIds);
  return Array.from(new Set(ids.filter((id) => known.has(id))));
}

function selectModulesForInput(input: StudioInput, fallbackModuleIds: string[]) {
  const moduleIds = input.requiredModuleIds?.length ? input.requiredModuleIds : fallbackModuleIds;
  const selected = modules.filter((module) => moduleIds.includes(module.id));
  return selected.length > 0
    ? selected
    : modules.filter((module) => fallbackModuleIds.includes(module.id));
}

function selectComplianceControls(input: StudioInput) {
  if (!input.complianceControlIds) return controls;
  const selected = controls.filter((control) => input.complianceControlIds?.includes(control.id));
  return selected;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function getSelectedPolygonStackItems(providerIds: string[]): Provider[] {
  const ids = new Set(providerIds);
  return modules.flatMap((module) =>
    module.providers.filter((provider) => ids.has(provider.id) && provider.polygonOwned),
  );
}

function formatUnitCost(value: number) {
  if (value >= 1 && value < 100) {
    return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
  }
  if (value >= 100) return formatMoney(value);
  return `$${value.toFixed(value < 0.01 ? 3 : 2)}`;
}

function fallbackProfile(moduleId: string, provider: Provider): ProviderPricingProfile {
  const customConfidence: CostConfidence = provider.pricingSignal.toLowerCase().includes("custom")
    ? "custom"
    : "public-signal";

  switch (moduleId) {
    case "wallet-infra":
      return {
        fixedAnnual: 12000,
        walletMonthlyFee: 0.02,
        freeWallets: 1000,
        confidence: customConfidence,
        basis: "wallet platform estimate",
        note: "Fallback wallet model uses a modest annual platform line plus MAW usage.",
      };
    case "crosschain":
      return {
        volumeBps: 5,
        transactionFee: 0.02,
        confidence: customConfidence,
        basis: "dynamic route quote",
        note: "Fallback crosschain model uses route bps plus per-message gas/relayer cost.",
      };
    case "stablecoin-orchestration":
      return {
        fixedMonthly: 2500,
        volumeBps: 45,
        confidence: customConfidence,
        basis: "stablecoin orchestration blend",
        note: "Fallback stablecoin model uses a provider-fee blend across settlement and treasury routes.",
      };
    case "ramps":
      return {
        volumeBps: 220,
        confidence: customConfidence,
        basis: "ramp route fee blend",
        note: "Fallback ramp model uses a card/bank/local-method fee blend.",
      };
    case "cross-border":
      return {
        fixedMonthly: 2000,
        volumeBps: 55,
        confidence: customConfidence,
        basis: "cross-border payout blend",
        note: "Fallback payout model uses a corridor-weighted bps estimate.",
      };
    case "blockchain-integration":
      return {
        fixedAnnual: 12000,
        confidence: customConfidence,
        basis: "infra SaaS estimate",
        note: "Fallback chain-infra model uses an annual RPC/indexing/monitoring SaaS line.",
      };
    case "cdk":
      return {
        fixedAnnual: 72000,
        confidence: customConfidence,
        basis: "managed chain estimate",
        note: "Fallback BaaS model uses managed infrastructure and support cost signals.",
      };
    case "compliance-security":
      return {
        fixedAnnual: 55000,
        confidence: customConfidence,
        basis: "compliance platform estimate",
        note: "Fallback compliance model uses an annual platform line; per-check/KYT usage varies.",
      };
    case "settlement-chain":
      return {
        transactionFee: 0.05,
        confidence: customConfidence,
        basis: "chain gas estimate",
        note: "Fallback chain model uses a conservative per-transaction gas estimate; specific chain profiles override this.",
      };
    case "yield-treasury":
      return {
        fixedAnnual: 0,
        confidence: customConfidence,
        basis: "yield protocol estimate",
        note: "Yield protocols are revenue-generating rather than payment-cost lines; modeled at zero direct cost.",
      };
    case "card-issuing":
      return {
        fixedMonthly: 1500,
        transactionFee: 0.1,
        confidence: customConfidence,
        basis: "card issuing platform estimate",
        note: "Fallback issuing model uses platform access plus per-authorization cost; interchange upside is not credited here.",
      };
    case "identity":
      return {
        fixedMonthly: 99,
        verificationFee: 1.2,
        verificationMonthlyShare: 0.08,
        freeMonthlyVerifications: 50,
        confidence: customConfidence,
        basis: "identity verification estimate",
        note: "Fallback identity model uses platform access plus per-verification usage.",
      };
    default:
      return {
        fixedAnnual: 24000,
        confidence: "modeled",
        basis: "generic provider estimate",
        note: "Generic fallback used where no module-specific pricing model exists.",
      };
  }
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
    competitors: module.providers.filter((provider) => !provider.polygonOwned).slice(0, 6),
  }));
}

function buildArchitecture(
  input: StudioInput,
  selectedModules: OMSModule[],
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  const useCase = getUseCase(input.useCaseId);
  const selectedProviderCount = input.selectedProviderIds.length;
  const effectiveVendorCount = selectedProviderCount || input.vendorCount;
  const selectedControlLabels = selectComplianceControls(input).map((control) => control.label);
  const controlDetail = selectedControlLabels.length > 0
    ? selectedControlLabels.slice(0, 5).join(", ")
    : "No explicit compliance controls selected; add controls before production launch.";
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
      detail: controlDetail,
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
      detail: controlDetail,
    },
  ];

  if (input.mode === "migration") {
    nodes.unshift({
      id: "fragmented-stack",
      label: `${effectiveVendorCount} point providers`,
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
