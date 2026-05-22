"use client";

import {
  Braces,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDollarSign,
  Landmark,
  Network,
  Route,
  ShieldCheck,
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
          const selectedCount = module.providers.filter((provider) => selectedSet.has(provider.id)).length;
          return (
            <details key={module.id}>
              <summary>
                <span>
                  {moduleIcon(module.id)}
                  {shortModuleLabel(module.id, module.label)}
                </span>
                <span className="providerSummaryMeta">
                  <strong>{selectedCount}</strong>
                  <ChevronDown size={15} />
                </span>
              </summary>
              <div className="providerRows">
                {module.providers.map((provider) => {
                  const checked = selectedSet.has(provider.id);
                  return (
                    <button
                      key={provider.id}
                      className={checked ? "selected" : ""}
                      type="button"
                      disabled={mode === "launch"}
                      onClick={() => onToggleProvider(provider.id)}
                    >
                      {checked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      <span>
                        <strong>{provider.name}</strong>
                        <small>{provider.pricingSignal}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      {!isLaunchBenchmark && (
        <button className="addProviderButton" type="button">
          + Add other provider
        </button>
      )}

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
  };
  return icons[moduleId] ?? <Box size={size} />;
}
