/** Jednotný „uživatel“ pro osobní FitDenik (dokud není Supabase Auth). */
export function getFitdenikUserId(): string {
  return process.env.NEXT_PUBLIC_FITDENIK_USER_ID ?? "u1";
}
