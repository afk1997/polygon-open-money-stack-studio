"use client";

import {
  Braces,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDollarSign,
  CreditCard,
  Coins,
  Landmark,
  Layers3,
  Network,
  Route,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  Box,
} from "lucide-react";
import type { ReactNode } from "react";
import { modules } from "@/lib/data";
import type { StudioMode } from "@/lib/types";

export function ProviderSelector({
  mode,
  selectedProviderIds,
  benchmarkProviderIds,
  showBenchmarkForLaunch = true,
  showNote = true,
  onToggleProvider,
}: {
  mode: StudioMode;
  selectedProviderIds: string[];
  benchmarkProviderIds: string[];
  showBenchmarkForLaunch?: boolean;
  showNote?: boolean;
  onToggleProvider: (providerId: string) => void;
}) {
  const effectiveIds = mode === "launch" && showBenchmarkForLaunch ? benchmarkProviderIds : selectedProviderIds;
  const selectedSet = new Set(effectiveIds);
  const isLaunchBenchmark = mode === "launch" && showBenchmarkForLaunch;

  return (
    <section className="providerSelector">
      <div className="sectionHeader">
        <div className="providerHeading">
          <div className="providerTitleLine">
            <h3>{isLaunchBenchmark ? "Benchmark stack" : "Current providers"}</h3>
            {!isLaunchBenchmark && <small>Optional</small>}
          </div>
          {!isLaunchBenchmark && <p>Select if you are Modernizing Existing. This helps us calculate savings and create your migration plan.</p>}
        </div>
      </div>

      <div className="providerAccordion">
        {modules.map((module) => {
          const competitorProviders = module.providers.filter((provider) => !provider.polygonOwned);
          const selectedCount = competitorProviders.filter((provider) => selectedSet.has(provider.id)).length;
          const moduleLabel = shortModuleLabel(module.id, module.label);
          const selectedProviderNames = competitorProviders
            .filter((provider) => selectedSet.has(provider.id))
            .slice(0, 2)
            .map((provider) => provider.name);

          if (isLaunchBenchmark) {
            return (
              <article key={module.id} className="providerStaticCard">
                <span className="providerStaticIcon">{moduleIcon(module.id)}</span>
                <div>
                  <strong>{moduleLabel}</strong>
                  <small>
                    {selectedCount > 0
                      ? selectedProviderNames.join(" + ")
                      : "Not required for this use case"}
                  </small>
                </div>
                <span className="providerStaticMeta">
                  <b>{selectedCount}</b>
                </span>
              </article>
            );
          }

          return (
            <details key={module.id}>
              <summary>
                <span>
                  {moduleIcon(module.id)}
                  {moduleLabel}
                </span>
                <span className="providerSummaryMeta">
                  <strong>{selectedCount}</strong>
                  <ChevronDown size={15} />
                </span>
              </summary>
              <div className="providerRows">
                {module.providers.map((provider) => {
                  const checked = selectedSet.has(provider.id);
                  const isPolygonStack = Boolean(provider.polygonOwned);
                  return (
                    <button
                      key={provider.id}
                      className={[
                        checked ? "selected" : "",
                        isPolygonStack ? "polygonStackProvider" : "",
                      ].filter(Boolean).join(" ")}
                      type="button"
                      disabled={mode === "launch" || isPolygonStack}
                      onClick={() => onToggleProvider(provider.id)}
                    >
                      {isPolygonStack ? <CheckCircle2 size={16} /> : checked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      <span>
                        <strong>{provider.name}</strong>
                        <small>{isPolygonStack ? "Polygon OMS integrated layer" : provider.pricingSignal}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      {showNote && (
        <p className="modelNote">
          {isLaunchBenchmark
            ? "Benchmark stack: priced point solutions a new build would otherwise stitch together without OMS."
            : "Modernize Existing selections update the savings model immediately."}
        </p>
      )}
    </section>
  );
}

function shortModuleLabel(moduleId: string, label: string) {
  const labels: Record<string, string> = {
    ramps: "Cash Ramps & On/Off-Ramp",
    cdk: "BaaS / CDK",
    "compliance-security": "Compliance & Security",
    "settlement-chain": "Settlement Chain",
    "yield-treasury": "Yield / Treasury",
    "card-issuing": "Card Issuing / BaaS",
    identity: "Identity",
  };
  return labels[moduleId] ?? label;
}

function moduleIcon(moduleId: string) {
  const size = 15;
  const icons: Record<string, ReactNode> = {
    "wallet-infra": <WalletCards size={size} />,
    crosschain: <Network size={size} />,
    "stablecoin-orchestration": <CircleDollarSign size={size} />,
    ramps: <Landmark size={size} />,
    "cross-border": <Route size={size} />,
    "blockchain-integration": <Braces size={size} />,
    cdk: <Box size={size} />,
    "compliance-security": <ShieldCheck size={size} />,
    "settlement-chain": <Layers3 size={size} />,
    "yield-treasury": <TrendingUp size={size} />,
    "card-issuing": <CreditCard size={size} />,
    identity: <BadgeCheck size={size} />,
    intents: <Coins size={size} />,
  };
  return icons[moduleId] ?? <Box size={size} />;
}
