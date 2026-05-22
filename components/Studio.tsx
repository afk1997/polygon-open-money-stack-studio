"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { templates } from "@/lib/data";
import { defaultInput, normalizeInput } from "@/lib/engine";
import type { StudioInput, StudioMode } from "@/lib/types";
import { BuildingStage } from "./studio/BuildingStage";
import { IntakeExperience, defaultsForUseCase } from "./studio/IntakeExperience";
import { LabExperience } from "./studio/LabExperience";
import { ReportModal } from "./studio/ReportModal";
import { StudioTopbar } from "./studio/StudioTopbar";
import { providerModule, useStudioModel } from "./studio/useStudioModel";
import type { ComplianceId, RequirementId } from "./studio/config";
import type { LabStage, StudioChoices } from "./studio/types";

const intakeDefaultInput: StudioInput = {
  ...defaultInput,
  mode: "launch",
  useCaseId: "",
  monthlyVolume: 10000000,
  monthlyTransactions: 100000,
  activeWallets: 50000,
  settlementDays: 1,
  vendorCount: 0,
  apiSurfaceCount: 0,
  reconciliationFeeds: 3,
  complianceHandoffs: 0,
  selectedProviderIds: [],
  corridors: "",
};

export function Studio() {
  const [stage, setStage] = useState<LabStage>("intake");
  const [input, setInput] = useState<StudioInput>(intakeDefaultInput);
  const [workflow, setWorkflow] = useState("");
  const [choices, setChoices] = useState<StudioChoices>(() => ({
    requirements: defaultsForUseCase(defaultInput.useCaseId).requirements,
    compliance: defaultsForUseCase(defaultInput.useCaseId).compliance,
  }));
  const [stepIndex, setStepIndex] = useState(0);
  const [buildIndex, setBuildIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  const model = useStudioModel(input, choices);
  const visibleStepCount = input.mode === "launch" ? 3 : 4;

  useEffect(() => {
    if (stepIndex >= visibleStepCount) setStepIndex(visibleStepCount - 1);
  }, [stepIndex, visibleStepCount]);

  function patchInput(patch: Partial<StudioInput>) {
    setInput((current) => {
      const useCaseId = patch.useCaseId ?? current.useCaseId;
      const next = normalizeInput({ ...current, ...patch });
      return useCaseId === "" ? { ...next, useCaseId: "" } : next;
    });
  }

  function setMode(mode: StudioMode) {
    setInput((current) => {
      const needsMigrationDefault = mode === "migration" && current.useCaseId === "";
      return normalizeInput({
        ...current,
        ...(needsMigrationDefault
          ? {
              useCaseId: defaultInput.useCaseId,
              monthlyVolume: defaultInput.monthlyVolume,
              monthlyTransactions: defaultInput.monthlyTransactions,
              activeWallets: defaultInput.activeWallets,
              corridors: defaultInput.corridors,
            }
          : {}),
        mode,
        selectedProviderIds: mode === "launch" ? [] : defaultInput.selectedProviderIds,
        vendorCount: mode === "launch" ? 0 : defaultInput.selectedProviderIds.length,
        apiSurfaceCount: mode === "launch" ? 0 : 18,
        reconciliationFeeds: mode === "launch" ? 3 : 6,
        complianceHandoffs: mode === "launch" ? 0 : 4,
        settlementDays: mode === "launch" ? 1 : 3,
      });
    });
  }

  function setUseCase(useCaseId: string) {
    if (!useCaseId) {
      setInput((current) => ({
        ...current,
        useCaseId: "",
        corridors: "",
      }));
      return;
    }

    const selected = templates.find((template) => template.id === useCaseId) ?? templates[0]!;
    setInput((current) =>
      normalizeInput({
        ...current,
        useCaseId,
        monthlyVolume: selected.defaultVolume,
        monthlyTransactions: selected.defaultTransactions,
        activeWallets: selected.defaultWallets,
        corridors: selected.defaultCorridors,
      }),
    );
    setChoices(defaultsForUseCase(useCaseId));
  }

  function toggleRequirement(requirement: RequirementId) {
    setChoices((current) => {
      const selected = new Set(current.requirements);
      if (selected.has(requirement)) selected.delete(requirement);
      else selected.add(requirement);
      return { ...current, requirements: Array.from(selected) };
    });
  }

  function toggleCompliance(compliance: ComplianceId) {
    setChoices((current) => {
      const selected = new Set(current.compliance);
      if (selected.has(compliance)) selected.delete(compliance);
      else selected.add(compliance);
      return { ...current, compliance: Array.from(selected) };
    });
  }

  function toggleProvider(providerId: string) {
    if (input.mode === "launch") return;
    if (providerModule(providerId)?.provider.polygonOwned) return;
    setInput((current) => {
      const selected = new Set(current.selectedProviderIds);
      if (selected.has(providerId)) selected.delete(providerId);
      else selected.add(providerId);
      return normalizeInput({
        ...current,
        selectedProviderIds: Array.from(selected),
        vendorCount: Math.max(selected.size, 1),
      });
    });
  }

  async function draftStack() {
    setStage("building");
    setBuildIndex(0);
    for (let index = 0; index < 5; index += 1) {
      setBuildIndex(index);
      await wait(360);
    }
    setStage("lab");
  }

  const labInput = useMemo(
    () => model.effectiveInput,
    [model.effectiveInput],
  );

  return (
    <main className="studioApp">
      <StudioTopbar
        stage={stage}
        onReset={() => setStage("intake")}
        onReport={() => setReportOpen(true)}
      />

      <AnimatePresence mode="wait">
        {stage === "intake" && (
          <IntakeExperience
            key="intake"
            input={input}
            workflow={workflow}
            choices={choices}
            currentStepIndex={stepIndex}
            benchmarkProviderIds={model.benchmarkProviderIds}
            onPatchInput={patchInput}
            onWorkflowChange={setWorkflow}
            onModeChange={setMode}
            onUseCaseChange={setUseCase}
            onToggleRequirement={toggleRequirement}
            onToggleCompliance={toggleCompliance}
            onToggleProvider={toggleProvider}
            onStepChange={setStepIndex}
            onDraft={draftStack}
          />
        )}
        {stage === "building" && (
          <BuildingStage
            key="building"
            activeIndex={buildIndex}
            input={labInput}
            providerCount={labInput.selectedProviderIds.length}
            useCaseName={model.useCase.name}
          />
        )}
        {stage === "lab" && (
          <LabExperience
            key="lab"
            input={labInput}
            recommendation={model.recommendation}
            requiredModules={model.requiredModules}
            benchmarkProviderIds={model.benchmarkProviderIds}
            useCaseName={model.useCase.name}
            onEdit={() => setStage("intake")}
            onToggleProvider={toggleProvider}
            onOpenReport={() => setReportOpen(true)}
          />
        )}
      </AnimatePresence>

      <ReportModal
        input={labInput}
        recommendation={model.recommendation}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </main>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
