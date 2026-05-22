# `lib/engine.ts` Patch Instructions

This patch updates the cost engine to (1) fix four under-modeled competitor pricing entries, (2) add per-verification KYC math, and (3) register the four new modules + new providers introduced in `data/providers.json`.

Apply changes in the order shown. Each section has a clear before/after.

---

## 1 ▸ Update `moduleExposure` (around line 33)

Add four new keys for the new modules. The exposure tuple is `(volume_share, transactions_share, wallets_share)` — what fraction of the input volumes the module's providers are exposed to.

**Replace** the entire `moduleExposure` block with:

```ts
const moduleExposure: Record<string, { volume: number; transactions: number; wallets: number }> = {
  "wallet-infra": { volume: 0, transactions: 0.65, wallets: 1 },
  crosschain: { volume: 0.25, transactions: 0.35, wallets: 0 },
  "stablecoin-orchestration": { volume: 0.55, transactions: 0.45, wallets: 0.15 },
  ramps: { volume: 0.35, transactions: 0.3, wallets: 0 },
  "cross-border": { volume: 0.65, transactions: 0.4, wallets: 0 },
  "blockchain-integration": { volume: 0, transactions: 0.65, wallets: 0 },
  cdk: { volume: 0.12, transactions: 0.4, wallets: 0 },
  "compliance-security": { volume: 0, transactions: 0.55, wallets: 0.2 },
  // NEW modules
  "settlement-chain": { volume: 0, transactions: 1, wallets: 0 },        // chain pays per tx
  "yield-treasury": { volume: 0.4, transactions: 0, wallets: 0 },         // treasury holds % of monthly volume
  "card-issuing": { volume: 0.6, transactions: 0.4, wallets: 0 },         // card spend is volume + per-auth
  identity: { volume: 0, transactions: 0, wallets: 0.4 },                 // KYC scales with wallets
};
```

---

## 2 ▸ Fix four under-modeled existing profiles

Inside `providerPricingProfiles` (around lines 45–290), replace these four entries.

**`layerzero`** — bump from 3 bps to 6 bps:

```ts
  layerzero: {
    transactionFee: 0.025,
    volumeBps: 6,
    confidence: "public-signal",
    basis: "executor/DVN/gas quote",
    note: "Modeled at ~0.06% per LayerZero public token-transfer signal (was 3 bps in v1; corrected to 6).",
  },
```

**`chainlink-ccip`** — bump from 5 bps to 10 bps:

```ts
  "chainlink-ccip": {
    volumeBps: 10,
    transactionFee: 0.03,
    confidence: "published",
    basis: "gas, network fee, message fee",
    note: "Modeled at ~0.10% per CCIP token-transfer signal (was 5 bps; corrected to 10).",
  },
```

**`bridge`** — bump from 35 bps to 70 bps (Bridge.xyz discloses up to 1% FX spread; 70 is the fair mid-point):

```ts
  bridge: {
    volumeBps: 70,
    fixedMonthly: 5000,
    confidence: "published",
    basis: "stablecoin API plus FX spread",
    note: "Mid-point of disclosed up-to-1% FX spread (was 35 bps; corrected to 70).",
  },
```

**`sumsub`** — add per-verification cost (replaces fixed-only model):

```ts
  sumsub: {
    fixedMonthly: 299,
    transactionFee: 1.5,
    freeMonthlyTransactions: 50,
    confidence: "published",
    basis: "Compliance plan + per-verification",
    note: "Compliance plan $299/mo + $1.85/verification (modeled at $1.50 blended; fixed-only model in v1 understated KYC cost at scale).",
  },
```

**`persona`** — add per-verification cost:

```ts
  persona: {
    fixedMonthly: 250,
    transactionFee: 1.2,
    freeMonthlyTransactions: 100,
    confidence: "public-signal",
    basis: "Essential plan + per-verification",
    note: "Essential plan $250/mo + per-verification; startup program offers 500 free/mo for eligible companies.",
  },
```

Also revise the `op-stack` and `arbitrum-orbit` `note` strings so the rent-seeking story shows in the UI:

```ts
  "op-stack": {
    fixedAnnual: 96000,
    confidence: "public-signal",
    basis: "open source plus service/infra",
    note: "Open-source plus managed service/infra. Superchain members additionally owe 2.5% of revenue OR 15% of profit to OP Collective (whichever is greater) — not included in this fixed line.",
  },
  "arbitrum-orbit": {
    fixedAnnual: 96000,
    confidence: "public-signal",
    basis: "open framework plus service/infra",
    note: "Open framework plus managed service/infra. Independent Orbit chains additionally owe 10% of net protocol revenue to the Arbitrum DAO — not included in this fixed line.",
  },
```

---

## 3 ▸ Add new pricing profiles

Append the following entries to `providerPricingProfiles` (before the closing `}` of that block).

### Polygon-owned products — all set to `fixedAnnual: 0` because they live on the OMS side of the comparison

```ts
  coinme: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon Open Money Stack on-ramp",
    note: "Polygon-owned (acquired Jan 2026). B2B commercial via Polygon enterprise; not modeled as separate point-solution cost.",
  },
  agglayer: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon Open Money Stack interop",
    note: "FREE connection for CDK chains. Usage-based fees payable in any token. Not modeled as point-solution cost.",
  },
  "sequence-trails": {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon Open Money Stack intents",
    note: "Bundled with Sequence wallet plan. Trails processed 10M+ tx in <2 months with 2x conversion lift.",
  },
  vaultbridge: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon Open Money Stack yield",
    note: "Revenue-generating, not a cost line. Chain captures 4–8% APY on idle bridged TVL (Katana: $2M+ revenue on $230M deposited).",
  },
  "polygon-id": {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon Open Money Stack identity",
    note: "Open-source ZK identity; only infra/hosting cost (~$10–50K/yr at scale). No per-verification fees.",
  },
  "polygon-id-identity": {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Polygon Open Money Stack identity",
    note: "Open-source ZK identity; pairs with regulated KYC vendor for the initial verification moment, then issues reusable credentials.",
  },
  "polygon-pos": {
    fixedAnnual: 0,
    transactionFee: 0.002,
    confidence: "published",
    basis: "Polygon network gas",
    note: "$0.001–0.002 per transaction; 5-second finality; 3,200+ TPS reported.",
  },
  "polygon-zkevm": {
    fixedAnnual: 0,
    transactionFee: 0.015,
    confidence: "public-signal",
    basis: "zkEVM network gas",
    note: "ZK rollup; ~7–15x Polygon PoS cost; Ethereum-derived security.",
  },

  // Competitor chains
  base: {
    transactionFee: 0.09,
    confidence: "public-signal",
    basis: "Base network gas",
    note: "OP Stack rollup. ~45–90x Polygon PoS unit cost; 7-day L1 challenge window.",
  },
  "arbitrum-one": {
    transactionFee: 0.09,
    confidence: "public-signal",
    basis: "Arbitrum network gas",
    note: "Optimistic rollup; 7-day challenge window; TimeBoost MEV auction.",
  },
  optimism: {
    transactionFee: 0.09,
    confidence: "public-signal",
    basis: "Optimism network gas",
    note: "OP Stack mainnet. Superchain economics include 2.5% revenue or 15% profit share to OP Collective.",
  },
  solana: {
    transactionFee: 0.0015,
    confidence: "public-signal",
    basis: "Solana base + priority fees",
    note: "Base fee + dynamic priority fees; ~480ms finality; non-EVM (Rust/Anchor rebuild).",
  },
  stellar: {
    transactionFee: 0.0008,
    confidence: "published",
    basis: "Stellar base fee",
    note: "Payment-native L1; built-in DEX; non-EVM (Soroban).",
  },
  tron: {
    transactionFee: 2.5,
    confidence: "public-signal",
    basis: "Tron USDT transfer cost",
    note: "Energy/bandwidth model; USDT transfers $1.87–3.74; massive USDT volume but highest unit cost.",
  },
  "avalanche-c": {
    transactionFee: 0.2,
    confidence: "public-signal",
    basis: "Avalanche C-Chain gas",
    note: "Dynamic gas $0.05–0.50; subnets for app-specific chains; 4,500 TPS.",
  },
  "bnb-chain": {
    transactionFee: 0.006,
    confidence: "public-signal",
    basis: "BNB Chain gas",
    note: "Zero-fee stablecoin program through March 2026; Asia-Pacific user base.",
  },
  "ethereum-mainnet": {
    transactionFee: 0.5,
    confidence: "public-signal",
    basis: "Ethereum L1 gas",
    note: "Variable; sub-cent at low usage to several dollars under load; 12-second blocks.",
  },
  sui: {
    transactionFee: 0.003,
    confidence: "public-signal",
    basis: "Sui network gas",
    note: "Parallel execution; 480ms finality; non-EVM (Move).",
  },
  aptos: {
    transactionFee: 0.005,
    confidence: "public-signal",
    basis: "Aptos network gas",
    note: "Block-STM parallel execution; <1-sec finality; all fees burned.",
  },

  // Yield protocols (revenue-generating, modeled as zero cost)
  morpho: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "ERC-4626 vault (revenue-generating)",
    note: "Yield mechanism; 10–15% performance fee taken from yield generated, not from user payment volume.",
  },
  aave: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Lending market (revenue-generating)",
    note: "Yield mechanism; ~10% reserve factor from borrow interest. Not a cost line for a neobank routing treasury here.",
  },
  compound: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Lending market (revenue-generating)",
    note: "Yield mechanism; ~10% reserve factor from borrow interest.",
  },
  spark: {
    fixedAnnual: 0,
    confidence: "public-signal",
    basis: "Lending market (revenue-generating)",
    note: "Yield mechanism backed by Sky/MakerDAO governance-set rates.",
  },
  yearn: {
    fixedAnnual: 0,
    confidence: "published",
    basis: "Yield aggregator (revenue-generating)",
    note: "20% performance fee + 2% management on yield generated, not on payment volume.",
  },
  pendle: {
    fixedAnnual: 0,
    confidence: "published",
    basis: "Yield trading (revenue-generating)",
    note: "5% protocol fee on yield accrued; trading layer rather than treasury primitive.",
  },

  // Card issuing / BaaS
  "stripe-issuing": {
    fixedMonthly: 0,
    transactionFee: 0.1,
    confidence: "published",
    basis: "Stripe Issuing virtual card",
    note: "$0.10 per virtual card + interchange share. Physical cards $3.50.",
  },
  marqeta: {
    fixedAnnual: 100000,
    volumeBps: 4,
    confidence: "custom",
    basis: "enterprise issuing platform",
    note: "Custom enterprise minimums $100K+/yr typical; per-transaction processing on top.",
  },
  lithic: {
    fixedMonthly: 200,
    transactionFee: 0.08,
    confidence: "custom",
    basis: "card issuing API",
    note: "Startup-friendly; per-card and per-transaction pricing negotiated; interchange share configurable.",
  },
  unit: {
    fixedMonthly: 1000,
    confidence: "custom",
    basis: "BaaS platform",
    note: "Default $0 monthly available; takes 70% of net interchange share. Modeled as a modest platform line.",
  },
  galileo: {
    fixedAnnual: 60000,
    confidence: "custom",
    basis: "processor platform",
    note: "Custom enterprise minimums; legacy processor for many neobanks; SoFi-owned.",
  },
  column: {
    fixedMonthly: 500,
    confidence: "custom",
    basis: "nationally-chartered bank",
    note: "Direct bank charter; 100% interchange to program manager before bank fees.",
  },
  "treasury-prime": {
    fixedMonthly: 3000,
    confidence: "custom",
    basis: "multi-bank BaaS",
    note: "Monthly fee + usage; 50–90% interchange share based on volume.",
  },
  highnote: {
    fixedAnnual: 75000,
    confidence: "custom",
    basis: "issuing + ledger platform",
    note: "Custom; modern API with embedded ledger.",
  },
  "modern-treasury": {
    fixedMonthly: 2500,
    confidence: "custom",
    basis: "payment ops platform",
    note: "Best-in-class reconciliation/ledger across ACH/wire/RTP; pairs with an issuer rather than replacing one.",
  },

  // Identity (separate from compliance-security)
  "sumsub-identity": {
    fixedMonthly: 299,
    transactionFee: 1.5,
    freeMonthlyTransactions: 50,
    confidence: "published",
    basis: "Compliance plan + per-verification",
    note: "Same Sumsub pricing; appears in the identity module for direct head-to-head with Polygon ID.",
  },
  "persona-identity": {
    fixedMonthly: 250,
    transactionFee: 1.2,
    freeMonthlyTransactions: 100,
    confidence: "public-signal",
    basis: "Essential plan + per-verification",
    note: "Essential $250/mo + per-verification; startup program 500 free/mo for eligible.",
  },
  "veriff-identity": {
    fixedMonthly: 99,
    transactionFee: 1.5,
    freeMonthlyTransactions: 0,
    confidence: "published",
    basis: "Plus plan + per-verification",
    note: "Plus $99/mo + $0.80–3.00 per verification; biometric analysis included.",
  },
  "onfido-identity": {
    fixedAnnual: 60000,
    confidence: "custom",
    basis: "enterprise contract estimate",
    note: "Quote-only; benchmarks place enterprise contracts ~$60K/yr median.",
  },
  "jumio-identity": {
    fixedAnnual: 145000,
    confidence: "custom",
    basis: "enterprise contract estimate",
    note: "Benchmarks place premium contracts ~$145K/yr median.",
  },
  "civic-identity": {
    fixedMonthly: 0,
    transactionFee: 0.05,
    confidence: "public-signal",
    basis: "monthly active pass",
    note: "Web3-native; $0.05/month per active pass; reusable Pass model.",
  },
  "alloy-identity": {
    fixedAnnual: 45000,
    confidence: "custom",
    basis: "identity decisioning platform",
    note: "Orchestrates underlying KYC vendors with decisioning rules; cost on top of underlying vendor fees.",
  },

  // Privy explicit (was using fallback)
  privy: {
    fixedMonthly: 299,
    walletMonthlyFee: 0.018,
    freeWallets: 499,
    confidence: "published",
    basis: "Core plan + MAU overage",
    note: "Free up to 499 MAU; Core $299/mo to 2.5K MAU; enterprise per-signature pricing. Acquired by Stripe/Bridge June 2025.",
  },
```

---

## 4 ▸ Update `fallbackProfile` switch

Add four new cases for the new module IDs. **Replace** the entire `fallbackProfile` function with:

```ts
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
        note: "Fallback chain cost uses a conservative per-transaction estimate; tune per-chain via profile.",
      };
    case "yield-treasury":
      return {
        fixedAnnual: 0,
        confidence: customConfidence,
        basis: "yield protocol (revenue-generating)",
        note: "Yield protocols generate revenue rather than charge cost on payment volume; modeled as zero on the cost side.",
      };
    case "card-issuing":
      return {
        fixedMonthly: 1500,
        transactionFee: 0.1,
        confidence: customConfidence,
        basis: "card issuing platform estimate",
        note: "Fallback issuing platform model; interchange revenue offsets cost (not modeled here).",
      };
    case "identity":
      return {
        fixedMonthly: 99,
        transactionFee: 1.2,
        freeMonthlyTransactions: 50,
        confidence: customConfidence,
        basis: "KYC platform + per-verification",
        note: "Fallback identity model uses a platform line plus a per-verification cost; tune via specific provider profile.",
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
```

---

## 5 ▸ Recommended cosmetic: surface `polygonOwned` in battlecards

In `buildBattlecards` (near bottom of file) the current code shows the first 6 providers of each module. If `polygonOwned` providers exist in the module, you almost certainly want them excluded from the competitor list, since they ARE the Polygon stack — not competitors of it.

**Replace:**

```ts
function buildBattlecards(selectedModules: OMSModule[]): Battlecard[] {
  return selectedModules.map((module) => ({
    moduleId: module.id,
    moduleLabel: module.label,
    polygonAngle: module.polygonRole,
    competitors: module.providers.slice(0, 6),
  }));
}
```

**With:**

```ts
function buildBattlecards(selectedModules: OMSModule[]): Battlecard[] {
  return selectedModules.map((module) => ({
    moduleId: module.id,
    moduleLabel: module.label,
    polygonAngle: module.polygonRole,
    // Exclude Polygon-owned entries from the competitor row — they belong to the OMS itself.
    competitors: module.providers
      .filter((provider) => !provider.polygonOwned)
      .slice(0, 6),
  }));
}
```

---

## 6 ▸ Recommended: extend the cost-engine assumptions text

In `calculateCostModel`, expand the `assumptions` array with two new lines that reflect what the patch corrects:

```ts
    assumptions: [
      "Polygon OMS platform pricing is not public; OMS cost is modeled as an orchestration placeholder plus public Polygon network transaction cost signal.",
      usesProviderModel
        ? "Current stack fees are computed from selected point-solution providers. Provider volumes are allocated by OMS area so selecting multiple vendors in one area shares that route volume instead of double-counting full volume."
        : "Current stack fees use a blended point-solution model based on published competitor fee signals and corridor variability.",
      "Provider pricing lines are directional: published prices use public tables, public-signal lines use public ranges or fee structures, and custom-priced vendors use conservative scenario estimates.",
      "Working-capital release assumes stablecoin settlement reduces liquidity drag versus multi-day fiat settlement.",
      "No salary, headcount, or developer-cost savings are included by default because team costs vary heavily by market and hiring model.",
      // NEW
      "Sequence, Coinme, Agglayer, Sequence Trails, Vaultbridge, Polygon ID, and Polygon CDK are Polygon-owned components of the OMS (post Jan 2026 acquisitions) and are modeled at $0 on the current-stack comparison side; they appear as competitors only for transparency on what each layer provides.",
      "Yield protocols (Morpho, Aave, Compound, Spark, Yearn, Pendle, Vaultbridge) are revenue-generating, not cost-generating; they appear at $0 on the cost side. To model treasury upside, multiply (volume × settlementDays/365) by the yield rate separately.",
    ],
```

---

## 7 ▸ Optional: update `use-cases.json` to use the new modules

The new modules (`settlement-chain`, `identity`, `card-issuing`, `yield-treasury`) won't be selected as `requiredModules` by any existing use case unless you add them. Suggested edits:

- `neobank-dollar-account` → add `"settlement-chain"`, `"identity"`, `"card-issuing"`, `"yield-treasury"`
- `remittance-app` → add `"settlement-chain"`, `"identity"`
- `merchant-settlement` → add `"settlement-chain"`, `"card-issuing"`
- `agentic-payments` → add `"settlement-chain"`, `"identity"`
- `institutional-cdk` → add `"settlement-chain"`, `"yield-treasury"`, `"identity"`

(I haven't shipped these edits in the patch because the use case mix is your editorial choice; the engine will work either way.)

---

## Verification

After applying these changes, the cost engine should:

1. Show ~6 Polygon-owned chips per recommendation instead of treating Sequence/Coinme/Agglayer/CDK as competitor noise.
2. Produce ~2x higher modeled cost lines for LayerZero, CCIP, and Bridge.xyz (closer to their actual disclosed signals).
3. Produce dramatically higher modeled cost for Sumsub/Persona at scale (per-verification math, not fixed-only).
4. Generate cost lines for chain selection — picking Tron in `settlement-chain` should ballpark $1M+/yr against $24M monthly volume at 180K monthly tx; picking Polygon PoS should be in the low thousands.
5. Surface Vaultbridge as a strategic differentiator in the yield-treasury module without polluting the cost side.
