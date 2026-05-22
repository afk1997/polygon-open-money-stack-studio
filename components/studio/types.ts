import type { ComplianceId, RequirementId } from "./config";

export type LabStage = "intake" | "building" | "lab";

export type StudioChoices = {
  requirements: RequirementId[];
  compliance: ComplianceId[];
};
