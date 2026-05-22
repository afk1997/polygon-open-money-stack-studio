"use client";

import { CheckCircle2, Circle, Layers3 } from "lucide-react";
import { modules } from "@/lib/data";
import type { StudioMode } from "@/lib/types";

export function ProviderSelector({
  mode,
  selectedProviderIds,
  benchmarkProviderIds,
  showBenchmarkForLaunch = true,
  onToggleProvider,
}: {
  mode: StudioMode;
  selectedProviderIds: string[];
  benchmarkProviderIds: string[];
  showBenchmarkForLaunch?: boolean;
  onToggleProvider: (providerId: string) => void;
}) {
  const effectiveIds = mode === "launch" && showBenchmarkForLaunch ? benchmarkProviderIds : selectedProviderIds;
  const selectedSet = new Set(effectiveIds);
  const isLaunchBenchmark = mode === "launch" && showBenchmarkForLaunch;

  return (
    <section className="providerSelector">
      <div className="sectionHeader">
        <div>
          <h3>{isLaunchBenchmark ? "Benchmark stack" : "Current providers"}</h3>
          {!isLaunchBenchmark && <p>Select if you are Modernizing Existing. This helps us calculate savings and create your migration plan.</p>}
        </div>
        {!isLaunchBenchmark && <small>Optional</small>}
      </div>

      <div className="providerAccordion">
        {modules.map((module) => {
          const selectedCount = module.providers.filter((provider) => selectedSet.has(provider.id)).length;
          return (
            <details key={module.id}>
              <summary>
                <span>
                  <Layers3 size={15} />
                  {module.label}
                </span>
                <strong>{selectedCount}</strong>
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

      <p className="modelNote">
        {isLaunchBenchmark
          ? "Benchmark stack: priced point solutions a new build would otherwise stitch together without OMS."
          : "Modernize Existing selections update the savings model immediately."}
      </p>
    </section>
  );
}
