import { generateRecommendation } from "@/lib/engine";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return Response.json({
    recommendation: generateRecommendation({ ...body, mode: "launch" }),
  });
}
