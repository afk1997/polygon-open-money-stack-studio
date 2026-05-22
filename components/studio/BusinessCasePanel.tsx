"use client";

import { ClipboardList, Download, ShieldCheck } from "lucide-react";
import type { Recommendation, StudioInput } from "@/lib/types";
import { buildExportPitch, formatMoney } from "@/lib/engine";
import { Metric } from "./NumberField";

export function BusinessCasePanel({
  input,
  recommendation,
  onOpenPacket,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  onOpenPacket: () => void;
}) {
  const cost = recommendation.costModel;
  const topProviderLines = cost.providerCostLines
    .slice()
    .sort((a, b) => b.annualCost - a.annualCost)
    .slice(0, 5);

  return (
    <aside className="businessPanel">
      <section className="businessHero">
        <span className="kicker">{input.mode === "launch" ? "Benchmark comparison" : "Migration economics"}</span>
        <h2>{formatMoney(cost.firstYearNetSavings)}</h2>
        <p>Modeled first-year impact after platform estimate, public network cost signal, and migration cost.</p>
      </section>

      <div className="businessGrid">
        <Metric label="Current / benchmark" value={formatMoney(cost.currentAnnualCost)} />
        <Metric label="Modeled OMS" value={formatMoney(cost.modeledOmsAnnualCost)} />
        <Metric label="Steady-state savings" value={formatMoney(cost.steadyStateAnnualSavings)} />
        <Metric label="Complexity reduction" value={`${cost.integrationComplexityReduction}%`} />
      </div>

      <section className="waterfallPanel">
        <div className="sectionHeader compact">
          <div>
            <span>Savings waterfall</span>
            <h3>What moves the number</h3>
          </div>
        </div>
        <WaterfallRow label="Fee delta" value={cost.feeDelta} />
        <WaterfallRow label="Fixed vendor savings" value={cost.fixedVendorSavings} />
        <WaterfallRow label="Working-capital release" value={cost.workingCapitalRelease} />
        <WaterfallRow label="Migration cost" value={-cost.migrationCost} negative />
      </section>

      <section className="providerCostPanel">
        <div className="sectionHeader compact">
          <div>
            <span>Provider cost lines</span>
            <h3>{cost.selectedProviderCount} providers priced</h3>
          </div>
        </div>
        {topProviderLines.length > 0 ? (
          topProviderLines.map((line) => (
            <div key={`${line.moduleId}-${line.providerId}`} className="costLine">
              <span>
                <strong>{line.providerName}</strong>
                <small>{line.moduleLabel} / {line.confidence}</small>
              </span>
              <b>{formatMoney(line.annualCost)}</b>
            </div>
          ))
        ) : (
          <p className="mutedCopy">No selected provider lines yet.</p>
        )}
      </section>

      <section className="controlPanel">
        <div className="sectionHeader compact">
          <div>
            <span>Compliance controls</span>
            <h3>Required risk map</h3>
          </div>
          <ShieldCheck size={18} />
        </div>
        <div className="controlList">
          {recommendation.compliance.slice(0, 6).map((control) => (
            <span key={control.id}>{control.label}</span>
          ))}
        </div>
      </section>

      <section className="packetPanelCompact">
        <button type="button" onClick={onOpenPacket}>
          <ClipboardList size={17} />
          Generate PMM packet
        </button>
        <button type="button">
          <Download size={17} />
          Export canvas
        </button>
      </section>

      <details className="sourceCaveat">
        <summary>Source caveat</summary>
        <p>
          Polygon OMS pricing is early-access/custom. Competitor lines use public pricing, public
          signals, and scenario estimates. Salary and headcount savings are excluded.
        </p>
        <textarea suppressHydrationWarning readOnly value={buildExportPitch(input)} />
      </details>
    </aside>
  );
}

function WaterfallRow({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className={negative ? "waterfallRow negative" : "waterfallRow"}>
      <span>{label}</span>
      <strong>{formatMoney(value)}</strong>
    </div>
  );
}
