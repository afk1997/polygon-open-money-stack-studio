type ContextMatcher = {
  id: string;
  patterns: RegExp[];
};

const moduleMatchers: ContextMatcher[] = [
  { id: "wallet-infra", patterns: [/wallet/, /balance/, /account ledger/, /stored value/] },
  { id: "stablecoin-orchestration", patterns: [/stablecoin/, /usdc/, /settlement/, /treasury/] },
  { id: "ramps", patterns: [/cash[-\s]?in/, /cash[-\s]?out/, /on[-\s]?ramp/, /off[-\s]?ramp/, /bank transfer/, /card/, /local fiat/] },
  { id: "cross-border", patterns: [/cross[-\s]?border/, /remittance/, /corridor/, /payout/, /mxn|brl|php|inr|latam|emea|apac/] },
  { id: "crosschain", patterns: [/crosschain/, /bridge/, /agglayer/, /intent/, /sequence trails/] },
  { id: "blockchain-integration", patterns: [/rpc/, /indexer/, /webhook/, /onchain/, /smart contract/] },
  { id: "cdk", patterns: [/dedicated chain/, /appchain/, /rollup/, /cdk/] },
  { id: "settlement-chain", patterns: [/settlement chain/, /base|solana|stellar|tron|polygon pos/] },
  { id: "identity", patterns: [/identity/, /credential/, /kyc/, /kyb/, /verification/] },
  { id: "card-issuing", patterns: [/card issuing/, /debit card/, /prepaid card/, /interchange/] },
  { id: "yield-treasury", patterns: [/yield/, /idle tvl/, /vaultbridge/] },
  { id: "compliance-security", patterns: [/compliance/, /sanction/, /pep/, /kyt/, /travel rule/, /audit/, /freeze/] },
];

const complianceMatchers: ContextMatcher[] = [
  { id: "kyc", patterns: [/kyc/, /kyb/, /identity/, /verification/] },
  { id: "sanctions", patterns: [/sanction/, /pep/, /adverse media/] },
  { id: "wallet-risk", patterns: [/kyt/, /wallet risk/, /onchain risk/, /transaction monitoring/] },
  { id: "travel-rule", patterns: [/travel rule/] },
  { id: "velocity", patterns: [/velocity/, /limit/, /cap/, /spend control/] },
  { id: "ledger", patterns: [/audit/, /reconciliation/, /ledger/] },
  { id: "webhooks", patterns: [/webhook/, /retry/, /idempotency/] },
  { id: "incident-freeze", patterns: [/freeze/, /incident/, /allowlist/, /denylist/, /blocklist/] },
];

export function moduleIdsFromContext(context: string) {
  return matchContextIds(context, moduleMatchers);
}

export function complianceControlIdsFromContext(context: string) {
  return matchContextIds(context, complianceMatchers);
}

export function mergeUniqueIds(...groups: Array<string[] | undefined>) {
  return Array.from(new Set(groups.flatMap((group) => group ?? [])));
}

function matchContextIds(context: string, matchers: ContextMatcher[]) {
  const value = context.toLowerCase();
  if (!value.trim()) return [];
  return matchers
    .filter(({ patterns }) => patterns.some((pattern) => pattern.test(value)))
    .map(({ id }) => id);
}
