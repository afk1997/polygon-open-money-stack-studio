"use client";

import { Edit3, Factory, Sparkles } from "lucide-react";
import type { StudioInput } from "@/lib/types";
import { formatMoney } from "@/lib/engine";
import { modeLabel } from "./config";
import { Metric } from "./NumberField";
import { ProviderSelector } from "./ProviderSelector";

export function CommandPanel({
  input,
  benchmarkProviderIds,
  useCaseName,
  onEdit,
  onToggleProvider,
}: {
  input: StudioInput;
  benchmarkProviderIds: string[];
  useCaseName: string;
  onEdit: () => void;
  onToggleProvider: (providerId: string) => void;
}) {
  const providerCount = input.mode === "launch" ? benchmarkProviderIds.length : input.selectedProviderIds.length;

  return (
    <aside className="commandPanel">
      <div className="commandHeader">
        <span>{input.mode === "launch" ? <Sparkles size={16} /> : <Factory size={16} />}</span>
        <div>
          <strong>{modeLabel(input.mode)}</strong>
          <small>{useCaseName}</small>
        </div>
        <button type="button" onClick={onEdit} aria-label="Edit intake">
          <Edit3 size={16} />
        </button>
      </div>

      <div className="miniMetrics">
        <Metric label="Monthly volume" value={formatMoney(input.monthlyVolume)} />
        <Metric label="Transactions / month" value={input.monthlyTransactions.toLocaleString()} />
        <Metric label={input.mode === "launch" ? "Benchmark providers" : "Current providers"} value={String(providerCount)} />
        <Metric label="Settlement days" value={`${input.settlementDays}`} />
      </div>

      <ProviderSelector
        mode={input.mode}
        selectedProviderIds={input.selectedProviderIds}
        benchmarkProviderIds={benchmarkProviderIds}
        onToggleProvider={onToggleProvider}
      />
    </aside>
  );
}
