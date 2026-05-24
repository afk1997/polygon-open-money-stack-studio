"use client";

import {
  ArrowRight,
  Banknote,
  Factory,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { templates } from "@/lib/data";
import type { StudioInput, StudioMode } from "@/lib/types";
import {
  defaultCompliance,
  defaultRequirementsByUseCase,
  intakeSteps,
  modeLabel,
} from "./config";
import type { ComplianceId, RequirementId } from "./config";
import { NumberField, TextAreaField } from "./NumberField";
import { ProviderSelector } from "./ProviderSelector";
import type { StudioChoices } from "./types";

export function IntakeExperience({
  input,
  workflow,
  choices,
  currentStepIndex,
  benchmarkProviderIds,
  onPatchInput,
  onWorkflowChange,
  onModeChange,
  onUseCaseChange,
  onToggleRequirement,
  onToggleCompliance,
  onToggleProvider,
  onStepChange,
  onSaveDraft,
  draftSaved,
  onDraft,
}: {
  input: StudioInput;
  workflow: string;
  choices: StudioChoices;
  currentStepIndex: number;
  benchmarkProviderIds: string[];
  onPatchInput: (patch: Partial<StudioInput>) => void;
  onWorkflowChange: (value: string) => void;
  onModeChange: (mode: StudioMode) => void;
  onUseCaseChange: (useCaseId: string) => void;
  onToggleRequirement: (requirement: RequirementId) => void;
  onToggleCompliance: (compliance: ComplianceId) => void;
  onToggleProvider: (providerId: string) => void;
  onStepChange: (index: number) => void;
  onSaveDraft: () => void;
  draftSaved: boolean;
  onDraft: () => void;
}) {
  void currentStepIndex;
  void onStepChange;

  return (
    <motion.section
      className="intakeStage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="intakeFrame">
        <aside className="intakeAside">
          <span className="kicker">Mode</span>
          <div className="modeStack">
            <button
              className={input.mode === "launch" ? "active" : ""}
              type="button"
              onClick={() => onModeChange("launch")}
            >
              Launch New
              <span />
            </button>
            <button
              className={input.mode === "migration" ? "active" : ""}
              type="button"
              onClick={() => onModeChange("migration")}
            >
              Optimize Existing
              <span />
            </button>
          </div>

          <div className="modeExplainer">
            <span>{input.mode === "launch" ? <Sparkles size={18} /> : <Factory size={18} />}</span>
            <div>
              <strong>{modeLabel(input.mode)}</strong>
              <p>
                {input.mode === "launch"
                  ? "Design a money movement product from scratch and get an optimal OMS stack for your use case."
                  : "Map your current providers, costs, and controls into a Polygon OMS migration plan."}
              </p>
            </div>
          </div>
        </aside>

        <section className="intakeMain">
          <ProductStep
            input={input}
            workflow={workflow}
            onPatchInput={onPatchInput}
            onWorkflowChange={onWorkflowChange}
            onUseCaseChange={onUseCaseChange}
          />
          <AssumptionsStep input={input} onPatchInput={onPatchInput} />
        </section>

        <aside className="intakeProviders">
          <ProviderSelector
            mode={input.mode}
            selectedProviderIds={input.selectedProviderIds}
            benchmarkProviderIds={benchmarkProviderIds}
            showBenchmarkForLaunch={false}
            showNote={false}
            onToggleProvider={onToggleProvider}
          />
        </aside>

        <section className="intakeFlowPanel">
          <FlowStep
            choices={choices}
            onToggleRequirement={onToggleRequirement}
            onToggleCompliance={onToggleCompliance}
          />
        </section>

        <footer className="intakeFooter">
          <p>
            <LockKeyhole size={14} />
            Your inputs are secure and never shared.
          </p>
          <div>
            <button type="button" onClick={onSaveDraft}>{draftSaved ? "Saved draft" : "Save draft"}</button>
            <button className="primaryButton" type="button" onClick={onDraft}>
              Draft OMS stack
              <ArrowRight size={16} />
            </button>
          </div>
        </footer>
      </div>
    </motion.section>
  );
}

function ProductStep({
  input,
  workflow,
  onPatchInput,
  onWorkflowChange,
  onUseCaseChange,
}: {
  input: StudioInput;
  workflow: string;
  onPatchInput: (patch: Partial<StudioInput>) => void;
  onWorkflowChange: (value: string) => void;
  onUseCaseChange: (useCaseId: string) => void;
}) {
  return (
    <div className="intakeStep">
      <h1>Configure your money movement stack</h1>
      <p className="stepCopy">
        Answer a few questions so we can design the right OMS architecture, cost model, and go-to-market narrative.
      </p>
      <div className="productGrid">
        <label className="selectInput">
          <span>Use case</span>
          <select value={input.useCaseId} onChange={(event) => onUseCaseChange(event.target.value)}>
            <option value="" disabled>
              Select a use case
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <TextAreaField
          label="Optional context"
          value={workflow}
          placeholder="Add target users, payout markets, constraints, or product details..."
          maxLength={500}
          onChange={onWorkflowChange}
        />
      </div>
      <AssumptionNote />
    </div>
  );
}

function AssumptionNote() {
  return <span className="fieldHint">Modeled savings exclude salary and hiring assumptions.</span>;
}

function AssumptionsStep({
  input,
  onPatchInput,
}: {
  input: StudioInput;
  onPatchInput: (patch: Partial<StudioInput>) => void;
}) {
  return (
    <div className="assumptionsBlock">
      <h3>Assumptions</h3>
      <div className="assumptionGrid">
        <NumberField label="Monthly volume (USD)" value={input.monthlyVolume} onChange={(monthlyVolume) => onPatchInput({ monthlyVolume })} />
        <NumberField label="Transactions / month" value={input.monthlyTransactions} onChange={(monthlyTransactions) => onPatchInput({ monthlyTransactions })} />
        <NumberField label="Active wallets / accounts" value={input.activeWallets} onChange={(activeWallets) => onPatchInput({ activeWallets })} />
        <NumberField label="Settlement days target" value={input.settlementDays} suffix="days" step={0.25} onChange={(settlementDays) => onPatchInput({ settlementDays })} />
      </div>
    </div>
  );
}

function FlowStep({
  choices,
  onToggleRequirement,
  onToggleCompliance,
}: {
  choices: StudioChoices;
  onToggleRequirement: (requirement: RequirementId) => void;
  onToggleCompliance: (compliance: ComplianceId) => void;
}) {
  return (
    <div className="flowSection">
      <div className="sectionHeader">
        <div>
          <h3>Configure your flow</h3>
          <p>Tell us more about how money moves in your product.</p>
        </div>
      </div>

      <div className="flowCardGrid">
        <FlowCard
          icon={<ArrowRight size={18} />}
          title="Money movement"
          detail="How will money move across borders and within the product?"
          rows={[
            ["Domestic transfers", choices.requirements.includes("wallet-balances"), () => onToggleRequirement("wallet-balances")],
            ["Cross-border payouts", choices.requirements.includes("cross-border"), () => onToggleRequirement("cross-border")],
            ["Multi-currency support", choices.requirements.includes("multi-currency"), () => onToggleRequirement("multi-currency")],
            ["Settlement chain comparison", choices.requirements.includes("settlement-chain"), () => onToggleRequirement("settlement-chain")],
            ["Dedicated chain", choices.requirements.includes("dedicated-chain"), () => onToggleRequirement("dedicated-chain")],
          ]}
        />
        <FlowCard
          icon={<Landmark size={18} />}
          title="Cash-in / Cash-out"
          detail="How will users fund accounts and cash out locally?"
          rows={[
            ["Card on-ramp", choices.requirements.includes("cash-in"), () => onToggleRequirement("cash-in")],
            ["Bank transfer", choices.requirements.includes("cash-in"), () => onToggleRequirement("cash-in")],
            ["Local cash-out / payout", choices.requirements.includes("cash-out"), () => onToggleRequirement("cash-out")],
            ["Card issuing", choices.requirements.includes("card-issuing"), () => onToggleRequirement("card-issuing")],
            ["None / not required", !choices.requirements.includes("cash-in") && !choices.requirements.includes("cash-out"), () => {
              if (choices.requirements.includes("cash-in")) onToggleRequirement("cash-in");
              if (choices.requirements.includes("cash-out")) onToggleRequirement("cash-out");
            }],
          ]}
        />
        <FlowCard
          icon={<Banknote size={18} />}
          title="Stablecoin settlement"
          detail="How should stablecoins be used for settlement?"
          rows={[
            ["USDC settlement", choices.requirements.includes("cross-border"), () => onToggleRequirement("cross-border")],
            ["Hold balances", choices.requirements.includes("wallet-balances"), () => onToggleRequirement("wallet-balances")],
            ["Convert to local currency", choices.requirements.includes("cash-out"), () => onToggleRequirement("cash-out")],
            ["Treasury yield", choices.requirements.includes("treasury-yield"), () => onToggleRequirement("treasury-yield")],
            ["Not required", choices.requirements.length === 0, () => undefined],
          ]}
        />
        <FlowCard
          icon={<ShieldCheck size={18} />}
          title="Compliance requirements"
          detail="What compliance and risk controls are needed?"
          rows={[
            ["KYC/KYB", choices.compliance.includes("kyc-kyb"), () => onToggleCompliance("kyc-kyb")],
            ["Reusable identity", choices.requirements.includes("identity"), () => onToggleRequirement("identity")],
            ["Sanctions screening", choices.compliance.includes("sanctions"), () => onToggleCompliance("sanctions")],
            ["Travel Rule", choices.compliance.includes("travel-rule"), () => onToggleCompliance("travel-rule")],
            ["Wallet risk monitoring", choices.compliance.includes("kyt"), () => onToggleCompliance("kyt")],
          ]}
        />
      </div>
    </div>
  );
}

function FlowCard({
  icon,
  title,
  detail,
  rows,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  rows: Array<[string, boolean, () => void]>;
}) {
  return (
    <article className="flowCard">
      <div className="flowCardTop">
        <span>{icon}</span>
        <i />
      </div>
      <h4>{title}</h4>
      <p>{detail}</p>
      <div className="flowChecks">
        {rows.map(([label, selected, onClick]) => (
          <button key={label} type="button" className={selected ? "checked" : ""} onClick={onClick}>
            <span className="checkBox" aria-hidden="true">
              {selected ? "✓" : ""}
            </span>
            {label}
          </button>
        ))}
      </div>
    </article>
  );
}

export function visibleSteps(mode: StudioMode) {
  return intakeSteps.filter((step) => mode === "migration" || step.id !== "providers");
}

export function defaultsForUseCase(useCaseId: string) {
  return {
    requirements: defaultRequirementsByUseCase[useCaseId] ?? defaultRequirementsByUseCase["neobank-dollar-account"],
    compliance: defaultCompliance,
  };
}
