"use client";

import { Download, FileText, Info } from "lucide-react";
import { useState } from "react";
import type { Recommendation, StudioInput } from "@/lib/types";
import { buildExportPitch, formatMoney } from "@/lib/engine";

type BusinessTab = "business" | "providers" | "notes";

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
    cost.selectedProviderCount > 0
      ? cost.selectedProviderVariableCost
      : Math.max(cost.currentAnnualCost - cost.selectedProviderFixedCost, 0);
  const modeledMovementCost = Math.max(currentVariableFees - cost.feeDelta, 0);
  const currentFixedVendorCost =
    cost.selectedProviderCount > 0
      ? cost.selectedProviderFixedCost
      : Math.max(cost.currentAnnualCost - currentVariableFees, 0);
  const modeledFixedBaseline = Math.max(currentFixedVendorCost - cost.fixedVendorSavings, 0);
  const annualVolume = input.monthlyVolume * 12;
  const topProviderLines = cost.providerCostLines
    .slice()
    .sort((a, b) => b.annualCost - a.annualCost)
    .slice(0, 3);
  const providerLines = cost.providerCostLines.slice().sort((a, b) => b.annualCost - a.annualCost);
  const [activeTab, setActiveTab] = useState<BusinessTab>("business");

  return (
    <aside className="businessPanel">
      <nav className="businessTabs" aria-label="Report sections">
        <button
          className={activeTab === "business" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("business")}
        >
          Business case
        </button>
        <button
          className={activeTab === "providers" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("providers")}
        >
          Providers
        </button>
        <button
          className={activeTab === "notes" ? "active" : ""}
          type="button"
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
      </nav>

      {activeTab === "business" && (
        <section className="businessHero">
          <span>Savings waterfall</span>
          <p>{input.mode === "launch" ? "First-year launch advantage" : "First-year savings"}</p>
          <h2>{formatMoney(cost.firstYearNetSavings)}</h2>
          <div className="savingsFormula">
            <span>Modeled as</span>
            <strong>provider fee reduction + vendor fixed-cost reduction + settlement liquidity value</strong>
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
              title="Vendor fixed-cost reduction"
              detail="Selected vendors' annual platform and minimum costs only. Ops, engineering, and migration costs are excluded."
              beforeLabel="Current vendor fixed"
              beforeValue={currentFixedVendorCost}
              afterLabel="Modeled fixed baseline"
              afterValue={modeledFixedBaseline}
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
      )}

      {activeTab === "business" && (
        <section className="providerCostPanel">
          <div className="sectionHeader">
            <div>
              <span>Top cost lines</span>
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
      )}

      {activeTab === "providers" && (
        <section className="providerCostPanel">
          <div className="sectionHeader">
            <div>
              <span>Provider cost lines</span>
              <p>{providerLines.length} external providers priced</p>
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
          {cost.polygonStackItemsPriced.length > 0 && (
            <div className="integratedStackNote">
              <strong>Polygon OMS-side layers</strong>
              <p>{cost.polygonStackItemsPriced.join(", ")}</p>
              <small>Shown in the architecture, excluded from competitor cost lines.</small>
            </div>
          )}
          {providerLines.map((line) => (
            <div key={`${line.moduleId}-${line.providerId}`} className="costLine">
              <span>
                <strong>{line.providerName}</strong>
                <small>{line.moduleLabel} / {line.confidence}</small>
              </span>
              <b>{formatMoney(line.annualCost)}</b>
            </div>
          ))}
        </section>
      )}

      {activeTab === "notes" && (
        <section className="sourceCaveat sourceCaveatPanel">
          <h3>
            <Info size={16} />
            Model notes
          </h3>
          {cost.assumptions.map((assumption) => (
            <p key={assumption}>{assumption}</p>
          ))}
          <textarea suppressHydrationWarning readOnly value={buildExportPitch(input)} />
        </section>
      )}

      {activeTab === "business" && (
        <details className="sourceCaveat">
          <summary>
            <Info size={16} />
            Source caveat
          </summary>
          <p>
            Costs are modeled from selected point-solution providers and may vary by contract,
            route, volume, and compliance scope. Polygon OMS pricing is early-access/custom.
            Polygon-owned OMS components are shown as integrated stack layers, not as competitor
            cost lines.
          </p>
          <textarea suppressHydrationWarning readOnly value={buildExportPitch(input)} />
        </details>
      )}

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
