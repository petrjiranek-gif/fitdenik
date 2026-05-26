/**
 * Zvuky odpočtu pauzy (10×10 bodybuilding).
 * Prepare / Work = přednahrané hlasy (HTML Audio) — spolehlivé na iOS oproti speechSynthesis z timeru.
 */

const VOICE_CUE_PATHS = {
  prepare: "/audio/rest/prepare.aiff",
  work: "/audio/rest/work.aiff",
} as const;

let sharedCtx: AudioContext | null = null;
const voiceAudio: Partial<Record<keyof typeof VOICE_CUE_PATHS, HTMLAudioElement>> = {};
let prepareVoicePlayed = false;
let workVoicePlayed = false;
const scheduledCueTimeouts: number[] = [];

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) sharedCtx = new AudioContext();
  return sharedCtx;
}

async function ensureRunning(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") await ctx.resume();
}

function trySetPlaybackAudioSession(): void {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  try {
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* nepodporováno */
  }
}

function getVoiceAudio(kind: keyof typeof VOICE_CUE_PATHS): HTMLAudioElement {
  let el = voiceAudio[kind];
  if (!el) {
    el = new Audio(VOICE_CUE_PATHS[kind]);
    el.preload = "auto";
    voiceAudio[kind] = el;
  }
  return el;
}

/** Odemkne audio při gestu uživatele (potvrzení série / start session). */
export async function primeRestAudio(): Promise<void> {
  const ctx = getContext();
  if (ctx) {
    try {
      await ensureRunning(ctx);
      trySetPlaybackAudioSession();
      scheduleBeep(ctx, 440, ctx.currentTime, 0.02, 0.001);
    } catch {
      /* tichý fail */
    }
  }
  for (const kind of Object.keys(VOICE_CUE_PATHS) as (keyof typeof VOICE_CUE_PATHS)[]) {
    const a = getVoiceAudio(kind);
    a.volume = 1;
    try {
      a.load();
    } catch {
      /* ignore */
    }
  }
}

export function resetRestVoiceFlags(): void {
  prepareVoicePlayed = false;
  workVoicePlayed = false;
}

export function clearScheduledRestVoiceCues(): void {
  for (const id of scheduledCueTimeouts) window.clearTimeout(id);
  scheduledCueTimeouts.length = 0;
}

/**
 * Naplánuje Prepare (15 s před koncem) a Work (konec) hned při startu pauzy — z gesta uživatele.
 * Na iOS je spolehlivější než čekat na speechSynthesis z intervalu.
 */
export function scheduleRestVoiceCues(totalRestMs: number): void {
  clearScheduledRestVoiceCues();
  resetRestVoiceFlags();

  const prepareDelay = totalRestMs - 15_000;
  if (prepareDelay >= 0) {
    scheduledCueTimeouts.push(
      window.setTimeout(() => {
        void playPrepareVoice();
      }, prepareDelay),
    );
  } else {
    void playPrepareVoice();
  }

  scheduledCueTimeouts.push(
    window.setTimeout(() => {
      void playWorkVoice();
    }, totalRestMs),
  );
}

async function playVoiceFile(kind: keyof typeof VOICE_CUE_PATHS): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const ctx = getContext();
  if (ctx) await ensureRunning(ctx);
  trySetPlaybackAudioSession();

  const audio = getVoiceAudio(kind);
  audio.volume = 1;
  audio.currentTime = 0;
  await audio.play();
  return true;
}

/** Hlasité „Prepare“ — audio soubor, záloha speechSynthesis. */
export async function playPrepareVoice(): Promise<void> {
  if (prepareVoicePlayed) return;
  prepareVoicePlayed = true;
  try {
    await playVoiceFile("prepare");
    return;
  } catch {
    /* fallback */
  }
  speakEnglishFallback("Prepare");
}

/** Hlasité „Work“ — audio soubor + tón. */
export async function playWorkVoice(): Promise<void> {
  if (workVoicePlayed) return;
  workVoicePlayed = true;
  try {
    await playVoiceFile("work");
  } catch {
    speakEnglishFallback("Work");
  }
  const ctx = getContext();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime + 0.2;
    scheduleBeep(ctx, 880, t, 0.14, 0.4);
  } catch {
    /* tichý fail */
  }
}

function speakEnglishFallback(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 1;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find((v) => v.lang.startsWith("en"));
    if (en) utter.voice = en;
    window.speechSynthesis.speak(utter);
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

async function playRestMidBeep(): Promise<void> {
  await playBeep(640, 0.06, 0.11);
}

export async function playRestCountdownTick(
  secondsLeftCeil: number,
  loud = false,
): Promise<void> {
  const step = Math.min(5, Math.max(1, Math.round(secondsLeftCeil)));
  const freq = 520 + (5 - step) * 110;
  await playBeep(freq, loud ? 0.1 : 0.07, loud ? 0.42 : 0.13);
}

/** Jedna sekunda odpočtu — pípání; Prepare/Work řeší schedule + dedupe. */
export async function playRestCountdownCue(secondsLeftCeil: number): Promise<void> {
  const sec = Math.round(secondsLeftCeil);
  if (sec === 15) {
    await playPrepareVoice();
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

export async function playRestWorkCue(): Promise<void> {
  await playWorkVoice();
}

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

export async function playRestSkipped(): Promise<void> {
  clearScheduledRestVoiceCues();
  resetRestVoiceFlags();
  await playBeep(659.25, 0.09, 0.14);
}
