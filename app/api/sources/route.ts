import { getSources } from "@/lib/engine";

export async function GET() {
  return Response.json({ sources: getSources() });
}
