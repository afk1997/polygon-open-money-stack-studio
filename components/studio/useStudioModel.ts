import { useMemo } from "react";
import { modules, templates } from "@/lib/data";
import { generateRecommendation, normalizeInput } from "@/lib/engine";
import type { OMSModule, Provider, StudioInput } from "@/lib/types";
import {
  buildBenchmarkProviderIds,
  requiredModulesFromChoices,
} from "./config";
import type { StudioChoices } from "./types";

export function useStudioModel(input: StudioInput, choices: StudioChoices) {
  const useCase = useMemo(
    () => templates.find((template) => template.id === input.useCaseId) ?? templates[0]!,
    [input.useCaseId],
  );

  const requiredModuleIds = useMemo(
    () => requiredModulesFromChoices(useCase.requiredModules, choices.requirements, choices.compliance),
    [choices.compliance, choices.requirements, useCase.requiredModules],
  );

  const benchmarkProviderIds = useMemo(
    () => buildBenchmarkProviderIds(requiredModuleIds),
    [requiredModuleIds],
  );

  const effectiveInput = useMemo(() => {
    const selectedProviderIds =
      input.mode === "launch" ? benchmarkProviderIds : input.selectedProviderIds;
    return normalizeInput({
      ...input,
      selectedProviderIds,
      vendorCount:
        selectedProviderIds.length > 0 ? selectedProviderIds.length : input.vendorCount,
      complianceHandoffs: Math.max(input.complianceHandoffs, choices.compliance.length || 1),
    });
  }, [benchmarkProviderIds, choices.compliance.length, input]);

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
    module.providers.filter((provider) => ids.has(provider.id)),
  );
}

export function groupProvidersByModule(providerIds: string[]) {
  const ids = new Set(providerIds);
  return modules
    .map((module) => ({
      module,
      providers: module.providers.filter((provider) => ids.has(provider.id)),
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
