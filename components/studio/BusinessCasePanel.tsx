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
  const currentVariableFees =
    cost.selectedProviderVariableCost ||
    Math.max(cost.currentAnnualCost - cost.selectedProviderFixedCost - cost.operationalOverheadAnnualCost, 0);
  const modeledMovementCost = Math.max(currentVariableFees - cost.feeDelta, 0);
  const currentFixedOps = cost.selectedProviderFixedCost + cost.operationalOverheadAnnualCost;
  const modeledFixedOps = Math.max(currentFixedOps - cost.fixedVendorSavings, 0);
  const annualVolume = input.monthlyVolume * 12;
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
        <div className="savingsFormula">
          <span>Modeled as</span>
          <strong>provider fee reduction + vendor and ops reduction + settlement liquidity value</strong>
        </div>
        <div className="savingsBreakdown">
          <BreakdownRow
            title="Provider fee reduction"
            detail="Current point-solution variable fees minus modeled OMS movement cost."
            beforeLabel="Current variable fees"
            beforeValue={currentVariableFees}
            afterLabel="Modeled OMS movement"
            afterValue={modeledMovementCost}
            savings={cost.feeDelta}
          />
          <BreakdownRow
            title="Vendor and ops reduction"
            detail="Fixed vendor costs plus API, reconciliation, and compliance handoff overhead."
            beforeLabel="Current fixed + ops"
            beforeValue={currentFixedOps}
            afterLabel="Modeled OMS fixed"
            afterValue={modeledFixedOps}
            savings={cost.fixedVendorSavings}
          />
          <BreakdownRow
            title="Settlement liquidity value"
            detail={`${formatMoney(annualVolume)} annual volume with ${input.settlementDays}-day settlement drag modeled.`}
            beforeLabel="Current delay"
            beforeText={`${input.settlementDays} days`}
            afterLabel="Modeled OMS target"
            afterText="Near same-day"
            savings={cost.workingCapitalRelease}
          />
        </div>
        <div className="netSavings">
          <span>Total modeled savings</span>
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
        <button type="button" onClick={requestCanvasExport}>
          <Download size={17} />
          Export canvas
        </button>
      </section>
    </aside>
  );
}

function requestCanvasExport() {
  window.dispatchEvent(new CustomEvent("oms:export-canvas"));
}

function BreakdownRow({
  title,
  detail,
  beforeLabel,
  beforeValue,
  beforeText,
  afterLabel,
  afterValue,
  afterText,
  savings,
}: {
  title: string;
  detail: string;
  beforeLabel: string;
  beforeValue?: number;
  beforeText?: string;
  afterLabel: string;
  afterValue?: number;
  afterText?: string;
  savings: number;
}) {
  return (
    <div className="breakdownRow">
      <div className="breakdownCopy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
      <div className="breakdownMath">
        <span>
          <small>{beforeLabel}</small>
          <b>{beforeText ?? formatMoney(beforeValue ?? 0)}</b>
        </span>
        <i aria-hidden="true">→</i>
        <span>
          <small>{afterLabel}</small>
          <b>{afterText ?? formatMoney(afterValue ?? 0)}</b>
        </span>
      </div>
      <em>{formatMoney(savings)}</em>
    </div>
  );
}
