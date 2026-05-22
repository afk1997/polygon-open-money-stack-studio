"use client";

import type { OMSModule, Recommendation, StudioInput } from "@/lib/types";
import { BusinessCasePanel } from "./BusinessCasePanel";
import { CommandPanel } from "./CommandPanel";
import { OmsCanvas } from "./OmsCanvas";

export function LabExperience({
  input,
  recommendation,
  requiredModules,
  benchmarkProviderIds,
  useCaseName,
  onEdit,
  onToggleProvider,
  onOpenReport,
}: {
  input: StudioInput;
  recommendation: Recommendation;
  requiredModules: OMSModule[];
  benchmarkProviderIds: string[];
  useCaseName: string;
  onEdit: () => void;
  onToggleProvider: (providerId: string) => void;
  onOpenReport: () => void;
}) {
  return (
    <section className="labStage">
      <CommandPanel
        input={input}
        benchmarkProviderIds={benchmarkProviderIds}
        useCaseName={useCaseName}
        onEdit={onEdit}
        onToggleProvider={onToggleProvider}
      />
      <OmsCanvas input={input} recommendation={recommendation} requiredModules={requiredModules} />
      <BusinessCasePanel input={input} recommendation={recommendation} onOpenReport={onOpenReport} />
    </section>
  );
}
