export async function GET() {
  return Response.json({
    codex: {
      bridgeEnabled: process.env.CODEX_BRIDGE_ENABLED === "true",
      status: process.env.CODEX_BRIDGE_ENABLED === "true" ? "configured" : "not_configured",
    },
  });
}
