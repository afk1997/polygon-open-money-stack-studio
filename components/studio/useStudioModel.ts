import { useMemo } from "react";
import { modules, templates } from "@/lib/data";
import { generateRecommendation, normalizeInput } from "@/lib/engine";
import {
  complianceControlIdsFromContext,
  mergeUniqueIds,
  moduleIdsFromContext,
} from "@/lib/input-context";
import type { OMSModule, Provider, StudioInput } from "@/lib/types";
import {
  buildBenchmarkProviderIds,
  complianceControlIdsFromChoices,
  requiredModulesFromChoices,
} from "./config";
import type { StudioChoices } from "./types";

export function useStudioModel(input: StudioInput, choices: StudioChoices, workflowContext = "") {
  const cleanWorkflowContext = workflowContext.trim();
  const useCase = useMemo(
    () => templates.find((template) => template.id === input.useCaseId) ?? templates[0]!,
    [input.useCaseId],
  );

  const contextModuleIds = useMemo(
    () => moduleIdsFromContext(cleanWorkflowContext),
    [cleanWorkflowContext],
  );

  const contextComplianceControlIds = useMemo(
    () => complianceControlIdsFromContext(cleanWorkflowContext),
    [cleanWorkflowContext],
  );

  const chosenModuleIds = useMemo(
    () => requiredModulesFromChoices(useCase.requiredModules, choices.requirements, choices.compliance),
    [choices.compliance, choices.requirements, useCase.requiredModules],
  );

  const requiredModuleIds = useMemo(
    () =>
      mergeUniqueIds(
        chosenModuleIds,
        contextModuleIds,
        contextComplianceControlIds.length > 0 ? ["compliance-security"] : [],
      ),
    [chosenModuleIds, contextComplianceControlIds.length, contextModuleIds],
  );

  const benchmarkProviderIds = useMemo(
    () => buildBenchmarkProviderIds(requiredModuleIds),
    [requiredModuleIds],
  );

  const complianceControlIds = useMemo(
    () => mergeUniqueIds(complianceControlIdsFromChoices(choices.compliance), contextComplianceControlIds),
    [choices.compliance, contextComplianceControlIds],
  );

  const effectiveInput = useMemo(() => {
    const selectedProviderIds =
      input.mode === "launch" ? benchmarkProviderIds : input.selectedProviderIds;
    return normalizeInput({
      ...input,
      selectedProviderIds,
      vendorCount:
        selectedProviderIds.length > 0 ? selectedProviderIds.length : input.vendorCount,
      complianceHandoffs: complianceControlIds.length,
      requiredModuleIds,
      complianceControlIds,
      workflowContext: cleanWorkflowContext,
    });
  }, [benchmarkProviderIds, complianceControlIds, input, requiredModuleIds, cleanWorkflowContext]);

  const recommendation = useMemo(() => generateRecommendation(effectiveInput), [effectiveInput]);

  const requiredModules = useMemo(
    () => modules.filter((module) => requiredModuleIds.includes(module.id)),
    [requiredModuleIds],
  );

  const selectedProviders = useMemo(
    () => getProvidersByIds(effectiveInput.selectedProviderIds),
    [effectiveInput.selectedProviderIds],
  );

  const selectedByModule = useMemo(
    () => groupProvidersByModule(effectiveInput.selectedProviderIds),
    [effectiveInput.selectedProviderIds],
  );

  return {
    useCase,
    requiredModuleIds,
    requiredModules,
    benchmarkProviderIds,
    effectiveInput,
    recommendation,
    selectedProviders,
    selectedByModule,
  };
}

export function getProvidersByIds(providerIds: string[]) {
  const ids = new Set(providerIds);
  return modules.flatMap((module) =>
    module.providers.filter((provider) => ids.has(provider.id) && !provider.polygonOwned),
  );
}

export function groupProvidersByModule(providerIds: string[]) {
  const ids = new Set(providerIds);
  return modules
    .map((module) => ({
      module,
      providers: module.providers.filter((provider) => ids.has(provider.id) && !provider.polygonOwned),
    }))
    .filter((group) => group.providers.length > 0);
}

export function providerModule(providerId: string): { module: OMSModule; provider: Provider } | null {
  for (const module of modules) {
    const provider = module.providers.find((item) => item.id === providerId);
    if (provider) return { module, provider };
  }
  return null;
}
