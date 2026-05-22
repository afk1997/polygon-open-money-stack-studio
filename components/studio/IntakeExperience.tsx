"use client";

import { ArrowRight, CheckCircle2, Factory, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { templates } from "@/lib/data";
import type { StudioInput, StudioMode } from "@/lib/types";
import {
  complianceOptions,
  defaultCompliance,
  defaultRequirementsByUseCase,
  intakeSteps,
  modeLabel,
  requirementOptions,
} from "./config";
import type { ComplianceId, RequirementId } from "./config";
import { NumberField, TextAreaField, TextField } from "./NumberField";
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
  onDraft: () => void;
}) {
  const step = intakeSteps[currentStepIndex] ?? intakeSteps[0]!;
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < visibleSteps(input.mode).length - 1;

  return (
    <motion.section
      className="intakeStage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <aside className="intakeAside">
        <span className="kicker">Polygon OMS Studio</span>
        <h1>Configure your OMS stack</h1>
        <p>
          Build a launch blueprint or migration business case from use case, flow, provider,
          and cost assumptions.
        </p>
        <div className="modeGrid">
          <button
            className={input.mode === "launch" ? "active" : ""}
            type="button"
            onClick={() => onModeChange("launch")}
          >
            <Sparkles size={16} />
            Launch New
          </button>
          <button
            className={input.mode === "migration" ? "active" : ""}
            type="button"
            onClick={() => onModeChange("migration")}
          >
            <Factory size={16} />
            Modernize Existing
          </button>
        </div>
        <div className="intakeProgress">
          {visibleSteps(input.mode).map((item, index) => (
            <button
              key={item.id}
              className={currentStepIndex === index ? "active" : ""}
              type="button"
              onClick={() => onStepChange(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </button>
          ))}
        </div>
      </aside>

      <section className="intakeMain">
        {step.id === "product" && (
          <ProductStep
            input={input}
            workflow={workflow}
            onPatchInput={onPatchInput}
            onWorkflowChange={onWorkflowChange}
            onUseCaseChange={onUseCaseChange}
          />
        )}
        {step.id === "flow" && (
          <FlowStep
            choices={choices}
            onToggleRequirement={onToggleRequirement}
            onToggleCompliance={onToggleCompliance}
          />
        )}
        {step.id === "assumptions" && (
          <AssumptionsStep input={input} onPatchInput={onPatchInput} />
        )}
        {step.id === "providers" && (
          <ProviderSelector
            mode={input.mode}
            selectedProviderIds={input.selectedProviderIds}
            benchmarkProviderIds={benchmarkProviderIds}
            onToggleProvider={onToggleProvider}
          />
        )}

        <div className="intakeFooter">
          <button type="button" disabled={!canGoBack} onClick={() => onStepChange(currentStepIndex - 1)}>
            Back
          </button>
          {canGoNext ? (
            <button className="primaryButton" type="button" onClick={() => onStepChange(currentStepIndex + 1)}>
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button className="primaryButton" type="button" onClick={onDraft}>
              Draft OMS stack
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>
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
      <span className="kicker">{modeLabel(input.mode)}</span>
      <h2>Start with the product</h2>
      <p className="stepCopy">
        Choose a use case, add real context if needed, and keep the rest of the studio grounded in those assumptions.
      </p>
      <div className="productGrid">
        <label className="selectInput">
          <span>Use case</span>
          <select
            value={input.useCaseId}
            onChange={(event) => onUseCaseChange(event.target.value)}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Corridors"
          value={input.corridors}
          placeholder="USDC to MXN, BRL, PHP, INR"
          onChange={(corridors) => onPatchInput({ corridors })}
        />
      </div>
      <TextAreaField
        label="Optional context"
        value={workflow}
        placeholder="Add target users, payout markets, regulatory constraints, current workflow details, or product edge cases..."
        onChange={onWorkflowChange}
      />
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
    <div className="intakeStep">
      <span className="kicker">Product requirements</span>
      <h2>Pick the flows OMS needs to support</h2>
      <p className="stepCopy">Selected flows decide which OMS modules and benchmark providers get priced.</p>
      <div className="choiceGrid">
        {requirementOptions.map((option) => (
          <ChoiceButton
            key={option.id}
            selected={choices.requirements.includes(option.id)}
            label={option.label}
            detail={option.detail}
            onClick={() => onToggleRequirement(option.id)}
          />
        ))}
      </div>

      <div className="sectionHeader compact">
        <div>
          <span>Compliance requirements</span>
          <h3>Select controls that matter for the flow</h3>
        </div>
      </div>
      <div className="choiceGrid complianceGrid">
        {complianceOptions.map((option) => (
          <ChoiceButton
            key={option.id}
            selected={choices.compliance.includes(option.id)}
            label={option.label}
            detail={option.detail}
            onClick={() => onToggleCompliance(option.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AssumptionsStep({
  input,
  onPatchInput,
}: {
  input: StudioInput;
  onPatchInput: (patch: Partial<StudioInput>) => void;
}) {
  return (
    <div className="intakeStep">
      <span className="kicker">Cost assumptions</span>
      <h2>Set the modeled scale</h2>
      <p className="stepCopy">Use the closest real operating numbers. Salary and hiring assumptions stay outside the savings model.</p>
      <div className="assumptionGrid">
        <NumberField label="Monthly volume" value={input.monthlyVolume} onChange={(monthlyVolume) => onPatchInput({ monthlyVolume })} />
        <NumberField label="Transactions / month" value={input.monthlyTransactions} onChange={(monthlyTransactions) => onPatchInput({ monthlyTransactions })} />
        <NumberField label="Active wallets" value={input.activeWallets} onChange={(activeWallets) => onPatchInput({ activeWallets })} />
        <NumberField label="Settlement delay" value={input.settlementDays} suffix="days" step={0.25} onChange={(settlementDays) => onPatchInput({ settlementDays })} />
        <NumberField label="API surfaces" value={input.apiSurfaceCount} onChange={(apiSurfaceCount) => onPatchInput({ apiSurfaceCount })} />
        <NumberField label="Reconciliation feeds" value={input.reconciliationFeeds} onChange={(reconciliationFeeds) => onPatchInput({ reconciliationFeeds })} />
        <NumberField label="Compliance handoffs" value={input.complianceHandoffs} onChange={(complianceHandoffs) => onPatchInput({ complianceHandoffs })} />
      </div>
    </div>
  );
}

function ChoiceButton({
  selected,
  label,
  detail,
  onClick,
}: {
  selected: boolean;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button className={selected ? "choiceCard selected" : "choiceCard"} type="button" onClick={onClick}>
      <span>{selected && <CheckCircle2 size={16} />}{label}</span>
      <small>{detail}</small>
    </button>
  );
}

function visibleSteps(mode: StudioMode) {
  return intakeSteps.filter((step) => mode === "migration" || step.id !== "providers");
}

export function defaultsForUseCase(useCaseId: string) {
  return {
    requirements: defaultRequirementsByUseCase[useCaseId] ?? defaultRequirementsByUseCase["neobank-dollar-account"],
    compliance: defaultCompliance,
  };
}
