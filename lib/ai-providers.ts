import { buildDraftRun } from "./workflow";
import type { DraftRun, SettingsStatus, WorkflowDraftInput } from "./types";

type ProviderChoice = "openai" | "deepseek" | "auto" | "fallback";

export function getSettingsStatus(): SettingsStatus {
  const preferred = parseProvider(process.env.AI_PROVIDER);
  const openaiMissing = [
    !process.env.OPENAI_API_KEY ? "OPENAI_API_KEY" : "",
    !process.env.OPENAI_MODEL ? "OPENAI_MODEL" : "",
  ].filter(Boolean);
  const deepseekMissing = [
    !process.env.DEEPSEEK_API_KEY ? "DEEPSEEK_API_KEY" : "",
    !process.env.DEEPSEEK_MODEL ? "DEEPSEEK_MODEL" : "",
  ].filter(Boolean);

  return {
    preferredProvider: preferred,
    providers: [
      {
        provider: "openai",
        configured: openaiMissing.length === 0,
        modelConfigured: Boolean(process.env.OPENAI_MODEL),
        model: process.env.OPENAI_MODEL,
        missing: openaiMissing,
      },
      {
        provider: "deepseek",
        configured: deepseekMissing.length === 0,
        modelConfigured: Boolean(process.env.DEEPSEEK_MODEL),
        model: process.env.DEEPSEEK_MODEL,
        missing: deepseekMissing,
      },
    ],
    codexBridgeEnabled: process.env.CODEX_BRIDGE_ENABLED === "true",
  };
}

export async function draftStack(input: WorkflowDraftInput): Promise<DraftRun> {
  const preferred = parseProvider(process.env.AI_PROVIDER);

  if (preferred === "openai" || preferred === "auto") {
    const openai = await callOpenAi(input);
    if (openai) return openai;
  }

  if (preferred === "deepseek" || preferred === "auto") {
    const deepseek = await callDeepSeek(input);
    if (deepseek) return deepseek;
  }

  return buildDraftRun(input, "fallback", fallbackWarning(preferred));
}

function parseProvider(value: string | undefined): ProviderChoice {
  if (value === "openai" || value === "deepseek" || value === "auto") return value;
  return value ? "fallback" : "auto";
}

async function callOpenAi(input: WorkflowDraftInput): Promise<DraftRun | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        reasoning: { effort: process.env.OPENAI_REASONING_EFFORT ?? "xhigh" },
        input: [
          {
            role: "system",
            content:
              "Return a concise JSON object with title and subtitle for a Polygon OMS stack draft. Do not price vendors; local engine owns pricing.",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
      }),
    });
    if (!response.ok) return buildDraftRun(input, "fallback", `OpenAI adapter returned ${response.status}; deterministic fallback used.`);
    const payload = (await response.json()) as { output_text?: string };
    const run = buildDraftRun(input, "openai");
    const aiText = payload.output_text?.trim();
    return aiText ? { ...run, subtitle: aiText.slice(0, 220) } : run;
  } catch (error) {
    return buildDraftRun(input, "fallback", `OpenAI adapter failed; deterministic fallback used.`);
  }
}

async function callDeepSeek(input: WorkflowDraftInput): Promise<DraftRun | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL;
  if (!apiKey || !model) return null;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Return one short subtitle for a Polygon OMS stack draft. Do not price vendors; local engine owns pricing.",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
      }),
    });
    if (!response.ok) return buildDraftRun(input, "fallback", `DeepSeek adapter returned ${response.status}; deterministic fallback used.`);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const run = buildDraftRun(input, "deepseek");
    const aiText = payload.choices?.[0]?.message?.content?.trim();
    return aiText ? { ...run, subtitle: aiText.slice(0, 220) } : run;
  } catch (error) {
    return buildDraftRun(input, "fallback", `DeepSeek adapter failed; deterministic fallback used.`);
  }
}

function fallbackWarning(preferred: ProviderChoice) {
  if (preferred === "fallback") return "Invalid AI_PROVIDER. Deterministic local engine used.";
  return "No configured AI provider/model found. Deterministic local engine used.";
}
