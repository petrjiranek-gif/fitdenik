/**
 * Krátké tóny pro odpočet pauzy (živý trénink). Web Audio API — bez externích souborů.
 * První přehrání může vyžadovat uživatelskou interakci (prohlížeč); po potvrzení série je OK.
 */

let sharedCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) sharedCtx = new AudioContext();
  return sharedCtx;
}

async function ensureRunning(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") await ctx.resume();
}

function scheduleBeep(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  durationSec: number,
  gainValue: number,
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, startAt);
  osc.connect(g);
  g.connect(ctx.destination);
  g.gain.setValueAtTime(0, startAt);
  g.gain.linearRampToValueAtTime(gainValue, startAt + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, startAt + durationSec);
  osc.start(startAt);
  osc.stop(startAt + durationSec + 0.02);
}

/** Pip při zbývajících 5…1 s (vyšší tón blíž konci). */
export async function playRestCountdownTick(secondsLeftCeil: number): Promise<void> {
  const ctx = getContext();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime;
    const step = Math.min(5, Math.max(1, Math.round(secondsLeftCeil)));
    const freq = 520 + (5 - step) * 95;
    scheduleBeep(ctx, freq, t, 0.07, 0.13);
  } catch {
    /* tichý fail */
  }
}

/** Dvojitý tón = konec pauzy, začni další sérii. */
export async function playRestFinished(): Promise<void> {
  const ctx = getContext();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime;
    scheduleBeep(ctx, 523.25, t, 0.11, 0.16);
    scheduleBeep(ctx, 783.99, t + 0.16, 0.12, 0.17);
  } catch {
    /* tichý fail */
  }
}

/** Při ručním přeskočení pauzy — jeden kratší tón. */
export async function playRestSkipped(): Promise<void> {
  const ctx = getContext();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime;
    scheduleBeep(ctx, 659.25, t, 0.09, 0.14);
  } catch {
    /* tichý fail */
  }
}
