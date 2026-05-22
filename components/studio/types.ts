import type { ComplianceId, RequirementId } from "./config";

export type LabStage = "intake" | "building" | "lab";

export type PacketTab = "memo" | "slides" | "battlecard" | "sources";

export type StudioChoices = {
  requirements: RequirementId[];
  compliance: ComplianceId[];
};
