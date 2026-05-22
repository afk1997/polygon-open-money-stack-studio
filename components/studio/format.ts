export function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

export function parseNumber(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
