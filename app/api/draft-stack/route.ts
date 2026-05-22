import { draftStack } from "@/lib/ai-providers";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return Response.json({ draft: await draftStack(body) });
}
