/** AI Trenér — konfigurace Claude API (pouze server-side). */

/** Model dle specifikace IronMan2030_AI_Trener_Prompt.docx v1.0 */
export const IRON_MAN_COACH_MODEL = "claude-sonnet-4-20250514";

export const IRON_MAN_COACH_MAX_TOKENS = 2000;

export const IRON_MAN_COACH_ANTHROPIC_VERSION = "2023-06-01";

export function getAnthropicApiKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function isCoachApiConfigured(): boolean {
  return getAnthropicApiKey() != null;
}
