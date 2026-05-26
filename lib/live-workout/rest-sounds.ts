/**
 * Zvuky odpočtu pauzy (10×10 bodybuilding). Web Audio + Speech Synthesis.
 * 30 s / 1 min: při 15 s „Prepare“, pípání 14–6, hlasitý odpočet 5–1, na konci „Work“.
 *
 * Pozn.: Prohlížeč nemůže ztišit YouTube Music / Spotify — jen přehrát vlastní zvuk co nejhlasitěji.
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

/** Chromium: vyšší priorita přehrávání (ne ducking jiných aplikací). */
function trySetPlaybackAudioSession(): void {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  try {
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* nepodporováno */
  }
}

/** Volat po uživatelském gestu (potvrzení série) — odemkne audio na iOS. */
export async function primeRestAudio(): Promise<void> {
  const ctx = getContext();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    trySetPlaybackAudioSession();
    scheduleBeep(ctx, 440, ctx.currentTime, 0.02, 0.001);
  } catch {
    /* tichý fail */
  }
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
  g.gain.linearRampToValueAtTime(gainValue, startAt + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0008, startAt + durationSec);
  osc.start(startAt);
  osc.stop(startAt + durationSec + 0.03);
}

function speakEnglish(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1.05;
    utter.pitch = 1;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find((v) => v.lang.startsWith("en") && /US|GB/i.test(v.lang));
    if (en) utter.voice = en;
    window.speechSynthesis.speak(utter);
  } catch {
    /* tichý fail */
  }
}

async function playBeep(
  frequency: number,
  durationSec: number,
  gainValue: number,
): Promise<void> {
  const ctx = getContext();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    scheduleBeep(ctx, frequency, ctx.currentTime, durationSec, gainValue);
  } catch {
    /* tichý fail */
  }
}

/** Tiché pípnutí mezi Prepare a finálním odpočtem (zbývá 14–6 s). */
async function playRestMidBeep(): Promise<void> {
  await playBeep(640, 0.06, 0.11);
}

/** Pip při zbývajících 5…1 s; `loud` pro 10×10 odpočet 30 s / 1 min. */
export async function playRestCountdownTick(
  secondsLeftCeil: number,
  loud = false,
): Promise<void> {
  const step = Math.min(5, Math.max(1, Math.round(secondsLeftCeil)));
  const freq = 520 + (5 - step) * 110;
  await playBeep(freq, loud ? 0.1 : 0.07, loud ? 0.42 : 0.13);
}

/**
 * Jedna sekunda odpočtu 30 s / 1 min (volá se při změně ceil zbývajících sekund).
 */
export async function playRestCountdownCue(secondsLeftCeil: number): Promise<void> {
  const sec = Math.round(secondsLeftCeil);
  if (sec === 15) {
    speakEnglish("Prepare");
    return;
  }
  if (sec >= 6 && sec <= 14) {
    await playRestMidBeep();
    return;
  }
  if (sec >= 1 && sec <= 5) {
    await playRestCountdownTick(sec, true);
  }
}

/** Konec pauzy — hlas „Work“ (+ krátký tón). */
export async function playRestWorkCue(): Promise<void> {
  speakEnglish("Work");
  const ctx = getContext();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime + 0.35;
    scheduleBeep(ctx, 880, t, 0.14, 0.38);
  } catch {
    /* tichý fail */
  }
}

/** Dvojitý tón = konec pauzy (legacy / ruční režim). */
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

/** Při ručním přeskočení pauzy. */
export async function playRestSkipped(): Promise<void> {
  await playBeep(659.25, 0.09, 0.14);
}
