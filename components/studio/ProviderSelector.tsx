"use client";

import { CheckCircle2, Circle, Layers3 } from "lucide-react";
import { modules } from "@/lib/data";
import type { StudioMode } from "@/lib/types";

export function ProviderSelector({
  mode,
  selectedProviderIds,
  benchmarkProviderIds,
  onToggleProvider,
}: {
  mode: StudioMode;
  selectedProviderIds: string[];
  benchmarkProviderIds: string[];
  onToggleProvider: (providerId: string) => void;
}) {
  const effectiveIds = mode === "launch" ? benchmarkProviderIds : selectedProviderIds;
  const selectedSet = new Set(effectiveIds);

  return (
    <section className="providerSelector">
      <div className="sectionHeader">
        <div>
          <span>{mode === "launch" ? "Benchmark stack" : "Current providers"}</span>
          <h3>{mode === "launch" ? "Point-solution comparison" : "Select the stack you use today"}</h3>
        </div>
        <strong>{effectiveIds.length} providers</strong>
      </div>

      <div className="providerAccordion">
        {modules.map((module, index) => {
          const selectedCount = module.providers.filter((provider) => selectedSet.has(provider.id)).length;
          const showOpen = selectedCount > 0 || index < 2;
          return (
            <details key={module.id} open={showOpen}>
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

      <p className="modelNote">
        {mode === "launch"
          ? "Benchmark stack: priced point solutions a new build would otherwise stitch together without OMS."
          : "Your selections are priced as the current stack and update the savings model immediately."}
      </p>
    </section>
  );
}
