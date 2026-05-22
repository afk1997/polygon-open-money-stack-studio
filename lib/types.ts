export type StudioMode = "launch" | "migration";

export type PricingType = "published" | "public-signal" | "custom";
export type CostConfidence = PricingType | "modeled";

export type Provider = {
  id: string;
  name: string;
  category: string;
  pricingSignal: string;
  strength: string;
  tradeoff: string;
};

export type OMSModule = {
  id: string;
  label: string;
  polygonRole: string;
  providers: Provider[];
};

export type PricingEvidence = {
  providerId: string;
  source: string;
  url: string;
  evidence: string;
  type: PricingType;
};

export type UseCaseTemplate = {
  id: string;
  name: string;
  segment: string;
  headline: string;
  defaultVolume: number;
  defaultTransactions: number;
  defaultWallets: number;
  defaultCorridors: string;
  requiredModules: string[];
};

export type ComplianceControl = {
  id: string;
  label: string;
  phase: string;
  description: string;
};

export type MigrationPlaybook = {
  id: string;
  name: string;
  retained: string[];
  replaced: string[];
  wrapped: string[];
  phases: string[];
};

export type StudioInput = {
  mode: StudioMode;
  useCaseId: string;
  monthlyVolume: number;
  monthlyTransactions: number;
  activeWallets: number;
  settlementDays: number;
  vendorCount: number;
  apiSurfaceCount: number;
  reconciliationFeeds: number;
  complianceHandoffs: number;
  selectedProviderIds: string[];
  corridors: string;
};

export type CostModel = {
  currentAnnualCost: number;
  modeledOmsAnnualCost: number;
  selectedProviderAnnualCost: number;
  selectedProviderFixedCost: number;
  selectedProviderVariableCost: number;
  selectedProviderCount: number;
  providerCostLines: ProviderCostLine[];
  operationalOverheadAnnualCost: number;
  feeDelta: number;
  fixedVendorSavings: number;
  workingCapitalRelease: number;
  currentComplexityScore: number;
  modeledOmsComplexityScore: number;
  integrationComplexityReduction: number;
  migrationCost: number;
  firstYearNetSavings: number;
  steadyStateAnnualSavings: number;
  lowCaseSavings: number;
  highCaseSavings: number;
  assumptions: string[];
};

export type ProviderCostLine = {
  providerId: string;
  providerName: string;
  moduleId: string;
  moduleLabel: string;
  pricingBasis: string;
  confidence: CostConfidence;
  annualFixedCost: number;
  annualVariableCost: number;
  annualCost: number;
  calculationNote: string;
};

export type ArchitectureNode = {
  id: string;
  label: string;
  group: "current" | "oms" | "control" | "outcome";
  detail: string;
};

export type ArchitectureEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type Battlecard = {
  moduleId: string;
  moduleLabel: string;
  polygonAngle: string;
  competitors: Provider[];
};

export type Recommendation = {
  title: string;
  narrative: string;
  depthMoment: string;
  modules: OMSModule[];
  architecture: {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
  };
  costModel: CostModel;
  compliance: ComplianceControl[];
  playbook: MigrationPlaybook;
  battlecards: Battlecard[];
};
