/**
 * Zvuky odpočtu pauzy (10×10 bodybuilding).
 * Prepare / Work = WAV v public/audio/rest (Web Audio — stejná cesta jako pípání).
 */

const VOICE_CUE_PATHS = {
  prepare: "/audio/rest/prepare.wav",
  work: "/audio/rest/work.wav",
} as const;

type VoiceKind = keyof typeof VOICE_CUE_PATHS;

let sharedCtx: AudioContext | null = null;
const voiceBufferCache: Partial<Record<VoiceKind, AudioBuffer>> = {};
const voiceHtmlAudio: Partial<Record<VoiceKind, HTMLAudioElement>> = {};
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

async function loadVoiceBuffer(kind: VoiceKind): Promise<AudioBuffer> {
  const cached = voiceBufferCache[kind];
  if (cached) return cached;

  const ctx = getContext();
  if (!ctx) throw new Error("No AudioContext");

  const res = await fetch(VOICE_CUE_PATHS[kind], { cache: "force-cache" });
  if (!res.ok) throw new Error(`Voice file ${kind}: HTTP ${res.status}`);
  const data = await res.arrayBuffer();
  const buffer = await ctx.decodeAudioData(data.slice(0));
  if (buffer.duration < 0.05) throw new Error(`Voice file ${kind} is empty`);
  voiceBufferCache[kind] = buffer;
  return buffer;
}

/** Přehrání hlasu přes Web Audio (spolehlivé, stejně jako pípání). */
async function playVoiceViaWebAudio(kind: VoiceKind): Promise<void> {
  const ctx = getContext();
  if (!ctx) throw new Error("No AudioContext");
  await ensureRunning(ctx);
  trySetPlaybackAudioSession();

  const buffer = await loadVoiceBuffer(kind);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, ctx.currentTime);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  await new Promise<void>((resolve, reject) => {
    source.onended = () => resolve();
    source.addEventListener("error", () => reject(new Error("playback error")), { once: true });
  });
}

function getVoiceHtmlAudio(kind: VoiceKind): HTMLAudioElement {
  let el = voiceHtmlAudio[kind];
  if (!el) {
    el = new Audio(VOICE_CUE_PATHS[kind]);
    el.preload = "auto";
    voiceHtmlAudio[kind] = el;
  }
  return el;
}

async function playVoiceViaHtmlAudio(kind: VoiceKind): Promise<void> {
  const ctx = getContext();
  if (ctx) await ensureRunning(ctx);
  trySetPlaybackAudioSession();
  const audio = getVoiceHtmlAudio(kind);
  audio.volume = 1;
  audio.currentTime = 0;
  await audio.play();
}

async function playVoiceCue(kind: VoiceKind): Promise<void> {
  try {
    await playVoiceViaWebAudio(kind);
    return;
  } catch {
    /* Web Audio selhalo — záloha HTML Audio */
  }
  try {
    await playVoiceViaHtmlAudio(kind);
  } catch {
    speakEnglishFallback(kind === "prepare" ? "Prepare" : "Work");
  }
}

/** Odemkne audio + přednačte hlasy při gestu uživatele. */
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
  await Promise.all(
    (Object.keys(VOICE_CUE_PATHS) as VoiceKind[]).map(async (kind) => {
      try {
        await loadVoiceBuffer(kind);
      } catch {
        getVoiceHtmlAudio(kind).load();
      }
    }),
  );
}

export function resetRestVoiceFlags(): void {
  prepareVoicePlayed = false;
  workVoicePlayed = false;
}

export function clearScheduledRestVoiceCues(): void {
  for (const id of scheduledCueTimeouts) window.clearTimeout(id);
  scheduledCueTimeouts.length = 0;
}

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

export async function playPrepareVoice(): Promise<void> {
  if (prepareVoicePlayed) return;
  prepareVoicePlayed = true;
  await playVoiceCue("prepare");
}

export async function playWorkVoice(): Promise<void> {
  if (workVoicePlayed) return;
  workVoicePlayed = true;
  await playVoiceCue("work");
  const ctx = getContext();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime + 0.15;
    scheduleBeep(ctx, 880, t, 0.12, 0.35);
  } catch {
    /* tichý fail */
  }
}

function speakEnglishFallback(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    const speak = () => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find((v) => v.lang.startsWith("en"));
      if (en) utter.voice = en;
      window.speechSynthesis.speak(utter);
    };
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", speak, { once: true });
    } else {
      speak();
    }
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

/** EMOM finisher — začátek nové minuty (3 stoupající tóny). */
export async function playEmomMinuteStart(): Promise<void> {
  const ctx = getContext();
  if (!ctx) return;
  try {
    await ensureRunning(ctx);
    const t = ctx.currentTime;
    scheduleBeep(ctx, 660, t, 0.1, 0.3);
    scheduleBeep(ctx, 880, t + 0.14, 0.1, 0.34);
    scheduleBeep(ctx, 1108.73, t + 0.28, 0.14, 0.38);
  } catch {
    /* tichý fail */
  }
}

/** EMOM finisher — posledních 5 s každé minuty. */
export async function playEmomMinuteCountdownTick(secondsLeftCeil: number): Promise<void> {
  await playRestCountdownTick(secondsLeftCeil, secondsLeftCeil <= 3);
}

/** EMOM finisher — celá session doběhla. */
export async function playEmomSessionComplete(): Promise<void> {
  await playRestFinished();
}
