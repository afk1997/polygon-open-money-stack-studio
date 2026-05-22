import { getSettingsStatus } from "@/lib/ai-providers";

export async function GET() {
  return Response.json({ settings: getSettingsStatus() });
}
