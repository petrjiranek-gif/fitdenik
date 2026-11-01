/** AI Trenér — konfigurace Claude API (pouze server-side). */

/** Claude Sonnet 4 (claude-sonnet-4-20250514) byl 15. 6. 2026 stažen z API. */
export const IRON_MAN_COACH_MODEL = "claude-sonnet-5-5";

/** Rezerva na týdenní plán. Na Sonnet 5.5 počítá max_tokens i případné thinking. */
export const IRON_MAN_COACH_MAX_TOKENS = 4096;

/** Structured plán bez agentic smyčky — medium je bližší starému Sonnet 4 než default high. */
export const IRON_MAN_COACH_EFFORT = "medium";

export const IRON_MAN_COACH_ANTHROPIC_VERSION = "2023-06-01";

export function getAnthropicApiKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function isCoachApiConfigured(): boolean {
  return getAnthropicApiKey() != null;
}
