import complianceControls from "@/data/compliance-controls.json";
import migrationPlaybooks from "@/data/migration-playbooks.json";
import pricingEvidence from "@/data/pricing-evidence.json";
import providerModules from "@/data/providers.json";
import useCases from "@/data/use-cases.json";
import type {
  ComplianceControl,
  MigrationPlaybook,
  OMSModule,
  PricingEvidence,
  UseCaseTemplate,
} from "./types";

export const modules = providerModules as OMSModule[];
export const pricing = pricingEvidence as PricingEvidence[];
export const templates = useCases as UseCaseTemplate[];
export const controls = complianceControls as ComplianceControl[];
export const playbooks = migrationPlaybooks as MigrationPlaybook[];

export function getUseCase(useCaseId: string) {
  return templates.find((template) => template.id === useCaseId) ?? templates[0];
}

export function getModule(moduleId: string) {
  return modules.find((module) => module.id === moduleId);
}

export function getProvidersByIds(providerIds: string[]) {
  const ids = new Set(providerIds);
  return modules.flatMap((module) =>
    module.providers.filter((provider) => ids.has(provider.id)),
  );
}

export function getPricingForProvider(providerId: string) {
  return pricing.find((item) => item.providerId === providerId);
}
