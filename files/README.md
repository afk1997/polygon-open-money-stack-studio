# Polygon OMS Studio — Patch Bundle

Drop-in updates for `afk1997/polygon-open-money-stack-studio` to fix the structural issues identified in the accuracy review.

## Files in this bundle

| File | Destination in repo | What it does |
|------|---------------------|--------------|
| `providers.json` | `data/providers.json` | **Replace.** Adds 4 new modules, tags Polygon-owned products, adds missing entries (Coinme, Agglayer, Sequence Trails, Vaultbridge, Polygon ID). 142 providers across 12 modules. |
| `pricing-evidence.json` | `data/pricing-evidence.json` | **Replace.** Expands from 27 to 68 citations covering all new entries plus the most-selected previously-uncited competitors. |
| `types.ts` | `lib/types.ts` | **Replace.** Adds optional `polygonOwned: boolean` to the `Provider` type. |
| `ENGINE_PATCH.md` | (read & apply manually) | Precise instructions for editing `lib/engine.ts`: fix 5 under-modeled pricing entries (LayerZero, CCIP, Bridge, Sumsub, Persona), register 4 new modules in `moduleExposure` and `fallbackProfile`, add ~40 new provider pricing profiles, exclude `polygonOwned` providers from the competitor battlecard list. |

## Summary of changes vs. v1

### Structural (the big credibility fix)
- **Sequence** is now tagged `polygonOwned: true` with revised description noting the Jan 2026 acquisition. No longer competes against the OMS narrative.
- **Polygon CDK** entry renamed to *Polygon CDK + Agglayer*, tagged Polygon-owned, with explicit "no rent-seeking" framing vs. OP Stack (2.5% rev) and Arbitrum Orbit (10% rev).
- **Coinme** added as a new Polygon-owned entry in `ramps` — 48-state MTL, 50K+ retail locations, MSB-registered.
- **Agglayer** added as Polygon-owned in `crosschain` — pessimistic proofs, free for CDK chains.
- **Sequence Trails** added as Polygon-owned in `crosschain` — 10M+ tx in <2 months, 2x conversion lift.
- **Polygon ID / Privado ID** added in `compliance-security` AND as the headline entry in a new `identity` module.
- **Vaultbridge** added as the headline entry in a new `yield-treasury` module — the unique L2-level revenue mechanism.

### New modules (4)
1. **`settlement-chain`** — 13 chains incl. Polygon PoS at $0.002/tx vs. Base/Arbitrum/OP at $0.09, Solana at $0.0015, Tron at $2.50, Ethereum mainnet, etc.
2. **`yield-treasury`** — Vaultbridge + Morpho, Aave, Compound, Spark, Yearn, Pendle.
3. **`card-issuing`** — Stripe Issuing, Marqeta, Lithic, Unit.co, Galileo, Column, Treasury Prime, Highnote, Modern Treasury. Critical for neobank pitch because crypto rails don't generate interchange.
4. **`identity`** — Polygon ID alongside Sumsub, Persona, Veriff, Onfido, Jumio, Civic, Alloy.

### Pricing math corrections in `engine.ts`
- LayerZero: 3 bps → **6 bps** (matches public 0.063–0.07% signal)
- Chainlink CCIP: 5 bps → **10 bps** (matches public 0.10% signal)
- Bridge.xyz: 35 bps → **70 bps** (fair midpoint of disclosed up-to-1% spread)
- Sumsub: fixed-only $24K/yr → **$299/mo + $1.50/verification** (correctly scales with volume)
- Persona: fixed-only $30K/yr → **$250/mo + $1.20/verification**
- OP Stack & Arbitrum Orbit: notes now mention the 2.5% / 10% revenue-share so the "no rent-seeking" Polygon CDK angle is visible

### Module coverage in `engine.ts`
- `moduleExposure` extended with the 4 new module IDs (settlement-chain pays per tx; yield-treasury holds % of volume; card-issuing splits volume+per-tx; identity scales with wallets).
- `fallbackProfile` switch extended with the 4 new module IDs.
- ~40 new provider profiles added (Polygon-owned at $0 fixed; chain competitors at realistic per-tx fees; yield protocols at $0 cost with revenue-generating note; card issuers and identity vendors at researched pricing).

### UI fix
- `buildBattlecards` now filters out `polygonOwned: true` providers from the competitor row in each battlecard. Polygon's own products no longer show up as their own competitors.

## How to apply

```bash
# from your repo root:
cp /path/to/patch/providers.json        data/providers.json
cp /path/to/patch/pricing-evidence.json data/pricing-evidence.json
cp /path/to/patch/types.ts              lib/types.ts

# Then open ENGINE_PATCH.md and apply each numbered section to lib/engine.ts.
# The engine has 800 lines; the changes are localized to:
#   - moduleExposure table (around line 33)
#   - providerPricingProfiles map (around lines 45–290)
#   - fallbackProfile() function (near end of file)
#   - buildBattlecards() function (near end of file)
#   - calculateCostModel() assumptions array (around line 425)
```

## What still needs your editorial decision

1. **Use-case `requiredModules`** — the four new modules won't surface unless you add their IDs to existing use cases in `data/use-cases.json`. Recommendations in `ENGINE_PATCH.md` section 7.
2. **Default `selectedProviderIds`** in `engine.ts` — currently bootstraps with 11 competitor IDs. You may want to add the new chain (`polygon-pos` or a competitor like `base`) and one `card-issuing` provider so the default scenario reflects a realistic neobank stack.
3. **UI rendering of `polygonOwned`** — the flag is in the schema but you decide visually: a "Polygon stack" lane in the canvas, a colored chip, or a separate "Open Money Stack" panel above the competitor list.

## What this patch does NOT change

- The 9 existing use-case templates remain as-is.
- The cost-model math (BPS blending, working-capital release calc, complexity scoring) is untouched — only the input pricing profiles and module registry change.
- The Polygon OMS platform pricing is still kept as `custom/early-access`. We're not pretending exact OMS quotes are public.
- No API route changes. The patch is data + types + engine internals only.
