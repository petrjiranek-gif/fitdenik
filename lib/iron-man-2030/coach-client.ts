import {
  IRON_MAN_COACH_ANTHROPIC_VERSION,
  IRON_MAN_COACH_MAX_TOKENS,
  IRON_MAN_COACH_MODEL,
  getAnthropicApiKey,
} from "@/lib/iron-man-2030/coach-config";

export type CoachMessage = { role: "user" | "assistant"; content: string };

type AnthropicResponse = {
  content?: { type: string; text?: string }[];
  error?: { type?: string; message?: string };
};

export class CoachApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CoachApiError";
  }
}

/** Volání Claude Messages API — pouze z server route. */
export async function callClaudeCoach(input: {
  system: string;
  messages: CoachMessage[];
  maxTokens?: number;
}): Promise<string> {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    throw new CoachApiError("ANTHROPIC_API_KEY není nastavený na serveru.", 503);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": IRON_MAN_COACH_ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: IRON_MAN_COACH_MODEL,
      max_tokens: input.maxTokens ?? IRON_MAN_COACH_MAX_TOKENS,
      system: input.system,
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  const data = (await response.json()) as AnthropicResponse;

  if (!response.ok) {
    const detail = data.error?.message ?? `HTTP ${response.status}`;
    throw new CoachApiError(`Claude API: ${detail}`, response.status);
  }

  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) {
    throw new CoachApiError("Claude API vrátilo prázdnou odpověď.", 502);
  }

  return text;
}
