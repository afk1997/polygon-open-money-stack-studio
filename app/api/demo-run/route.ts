import { draftStack } from "@/lib/ai-providers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const draft = await draftStack(body);
  return Response.json({ demoTrace: draft.demoTrace, warning: draft.warning });
}
