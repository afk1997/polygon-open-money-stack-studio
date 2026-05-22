"use client";

import { Download, FileText, Info } from "lucide-react";
import type { Recommendation, StudioInput } from "@/lib/types";
import { buildExportPitch, formatMoney } from "@/lib/engine";

export function BusinessCasePanel({
  input,
  recommendation,
  onOpenReport,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  onOpenReport: () => void;
}) {
  const cost = recommendation.costModel;
  const topProviderLines = cost.providerCostLines
    .slice()
    .sort((a, b) => b.annualCost - a.annualCost)
    .slice(0, 3);

  return (
    <aside className="businessPanel">
      <nav className="businessTabs" aria-label="Report sections">
        <span className="active">Business case</span>
        <span>Providers</span>
        <span>Notes</span>
      </nav>

      <section className="businessHero">
        <span>Savings waterfall</span>
        <p>{input.mode === "launch" ? "First-year launch advantage" : "First-year savings"}</p>
        <h2>{formatMoney(cost.firstYearNetSavings)}</h2>
        <div className="waterfallBars">
          <BarRow label="Provider cost lines" value={cost.currentAnnualCost} tone="neutral" />
          <BarRow label="Fee delta" value={cost.feeDelta} tone="green" />
          <BarRow label="Fixed vendor savings" value={cost.fixedVendorSavings} tone="green" />
          <BarRow label="Working capital release" value={cost.workingCapitalRelease} tone="green" />
        </div>
        <div className="netSavings">
          <span>Net savings (yr 1)</span>
          <strong>{formatMoney(cost.firstYearNetSavings)}</strong>
        </div>
      </section>

      <section className="providerCostPanel">
        <div className="sectionHeader">
          <div>
            <span>Provider cost lines</span>
            <p>Annual run-rate</p>
          </div>
        </div>
        <div className="costSummary">
          <span>Current provider cost</span>
          <strong>{formatMoney(cost.currentAnnualCost)}</strong>
          <span>Modeled OMS cost</span>
          <strong>{formatMoney(cost.modeledOmsAnnualCost)}</strong>
          <span>Total savings</span>
          <strong>{formatMoney(cost.firstYearNetSavings)}</strong>
        </div>
        {topProviderLines.map((line) => (
          <div key={`${line.moduleId}-${line.providerId}`} className="costLine">
            <span>
              <strong>{line.providerName}</strong>
              <small>{line.moduleLabel} / {line.confidence}</small>
            </span>
            <b>{formatMoney(line.annualCost)}</b>
          </div>
        ))}
      </section>

      <details className="sourceCaveat">
        <summary>
          <Info size={16} />
          Source caveat
        </summary>
        <p>
          Costs are modeled from selected point-solution providers and may vary by contract,
          corridor, volume, and compliance scope. Polygon OMS pricing is early-access/custom.
        </p>
        <textarea suppressHydrationWarning readOnly value={buildExportPitch(input)} />
      </details>

      <section className="reportActions">
        <button className="primaryButton" type="button" onClick={onOpenReport}>
          <FileText size={17} />
          Generate switch report
        </button>
        <button type="button">
          <Download size={17} />
          Export canvas
        </button>
      </section>
    </aside>
  );
}

function BarRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "neutral" | "muted";
}) {
  return (
    <div className={`barRow ${tone}`}>
      <span>{label}</span>
      <i />
      <strong>{formatMoney(value)}</strong>
    </div>
  );
}
