"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BODYWEIGHT_WOD_ORDER,
  CROSSFIT_WOD_ORDER,
  LIVE_WODS,
  OPEN_SEASON_YEAR_ORDER,
  OPEN_WOD_KEYS_BY_YEAR,
  OPEN_YEAR_MIN,
  type LiveWodDefinition,
  type LiveWodKey,
  type OpenSeasonYear,
  totalTargetReps,
} from "@/lib/live-workout/wod-definitions";
import { formInputClass } from "@/components/fitdenik/form-fields";
import { saveLiveWorkoutLog } from "@/lib/live-workout/persist-log";
import {
  BODYBUILDING_EQUIPMENT,
  BODYBUILDING_MUSCLE_GROUPS,
  BODYBUILDING_MUSCLE_ORDER,
  type BodybuildingEquipmentId,
} from "@/lib/live-workout/bodybuilding-data";
import type { LiveSportCategory } from "@/lib/types";

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function angieProgressLabel(completed: number): string {
  if (completed >= 400) return "Hotovo";
  if (completed >= 300) return `Dřepy (${completed - 300}/100)`;
  if (completed >= 200) return `Sedy-lehy (${completed - 200}/100)`;
  if (completed >= 100) return `Kliky (${completed - 100}/100)`;
  return `Pull-upy (${completed}/100)`;
}

function andiProgressLabel(completed: number): string {
  if (completed >= 400) return "Hotovo";
  if (completed >= 300) return `Front squat (${completed - 300}/100)`;
  if (completed >= 200) return `Sumo DL HP (${completed - 200}/100)`;
  if (completed >= 100) return `Push press (${completed - 100}/100)`;
  return `Hang power snatch (${completed}/100)`;
}

/** Součet rep v definici ≥ této hodnoty = v UI „bez stropu“ (AMRAP / obecný Open), ne reálný cíl dokončení. */
const UNCAPPED_REPS_THRESHOLD = 9000;

type BodybuildingProgramKey = "1x100" | "10x10";
type TenByTenRestVariant = "manual10" | "count30" | "count60";

const BB_TARGET_REPS = 100;

const FREE_WORKOUT_WOD: LiveWodDefinition = {
  key: "free_workout",
  kind: "benchmark",
  name: "Free Workout",
  subtitle: "Volná evidence tréninku",
  scoreType: "Custom",
  prescription: "Volný trénink bez pevného předpisu.",
  description: "Zapisuj série, váhy a opakování podle vlastního tréninku.",
  segments: [{ label: "Volné opakování", reps: 0 }],
  benchmarks: [{ level: "Tip", timeRange: "sleduj techniku a progres zátěže po sériích" }],
  referenceUrl: "https://www.wodwell.com/",
  liveFinishAnytime: true,
  rxLoadDescription: "Doplň používané váhy a zapiš je po sériích níže.",
};

type HyroxStepDef = {
  name: string;
  target: string;
  defaultReps: number;
  kind: "reps" | "distance" | "time";
};

type HyroxVariantDef = {
  key: "home_light" | "home_medium" | "home_killer" | "indoor_low_impact";
  name: string;
  rounds: number;
  goalTime: string;
  kcalRange: string;
  summary: string;
  defaults: { farmerCarry: string; wallBall: string; deadlift: string; shinFriendly: boolean };
  steps: HyroxStepDef[];
};

const HYROX_VARIANTS: Record<HyroxVariantDef["key"], HyroxVariantDef> = {
  home_light: {
    key: "home_light",
    name: "HYROX HOME LIGHT",
    rounds: 4,
    goalTime: "25–35 min",
    kcalRange: "450–700 kcal",
    summary: "Kontrolovaný vstup, technika a pacing.",
    defaults: { farmerCarry: "2 × 15–17.5 kg", wallBall: "6 kg", deadlift: "40–50 kg", shinFriendly: true },
    steps: [
      { name: "Svižná chůze", target: "400 m", defaultReps: 400, kind: "distance" },
      { name: "TRX rows", target: "15 reps", defaultReps: 15, kind: "reps" },
      { name: "Push-ups", target: "10 reps", defaultReps: 10, kind: "reps" },
      { name: "Farmer carry", target: "40 m", defaultReps: 40, kind: "distance" },
      { name: "Wall balls", target: "12 reps", defaultReps: 12, kind: "reps" },
      { name: "Deadlift", target: "10 reps", defaultReps: 10, kind: "reps" },
      { name: "Burpees", target: "6 reps", defaultReps: 6, kind: "reps" },
    ],
  },
  home_medium: {
    key: "home_medium",
    name: "HYROX HOME MEDIUM",
    rounds: 5,
    goalTime: "30–42 min",
    kcalRange: "550–850 kcal",
    summary: "Hlavní pracovní varianta s nejlepším poměrem výkon/udržitelnost.",
    defaults: { farmerCarry: "2 × 20 kg", wallBall: "6 kg", deadlift: "50–60 kg", shinFriendly: true },
    steps: [
      { name: "Svižná chůze", target: "500 m", defaultReps: 500, kind: "distance" },
      { name: "TRX rows", target: "20 reps", defaultReps: 20, kind: "reps" },
      { name: "Push-ups", target: "12 reps", defaultReps: 12, kind: "reps" },
      { name: "Farmer carry", target: "40–50 m", defaultReps: 50, kind: "distance" },
      { name: "Wall balls", target: "15 reps", defaultReps: 15, kind: "reps" },
      { name: "Deadlift", target: "12 reps", defaultReps: 12, kind: "reps" },
      { name: "Burpees", target: "10 reps", defaultReps: 10, kind: "reps" },
    ],
  },
  home_killer: {
    key: "home_killer",
    name: "HYROX HOME KILLER",
    rounds: 6,
    goalTime: "35–50 min",
    kcalRange: "650–950 kcal",
    summary: "Velký burner se závodním feelingem.",
    defaults: { farmerCarry: "2 × 20–22.5 kg", wallBall: "6 kg", deadlift: "50–60 kg", shinFriendly: false },
    steps: [
      { name: "Rychlá chůze", target: "500 m", defaultReps: 500, kind: "distance" },
      { name: "TRX rows", target: "20 reps", defaultReps: 20, kind: "reps" },
      { name: "Push-ups", target: "20 reps", defaultReps: 20, kind: "reps" },
      { name: "Farmer carry", target: "50–60 m", defaultReps: 60, kind: "distance" },
      { name: "Wall balls", target: "15 reps", defaultReps: 15, kind: "reps" },
      { name: "Deadlift", target: "15 reps", defaultReps: 15, kind: "reps" },
      { name: "Burpees", target: "10 reps", defaultReps: 10, kind: "reps" },
    ],
  },
  indoor_low_impact: {
    key: "indoor_low_impact",
    name: "HYROX INDOOR LOW IMPACT",
    rounds: 5,
    goalTime: "30–42 min",
    kcalRange: "500–780 kcal",
    summary: "Šetrnější varianta bez skoků pro citlivé holeně.",
    defaults: { farmerCarry: "2 × 20 kg", wallBall: "6 kg", deadlift: "50–60 kg", shinFriendly: true },
    steps: [
      { name: "Step-ups", target: "40 reps", defaultReps: 40, kind: "reps" },
      { name: "TRX rows", target: "20 reps", defaultReps: 20, kind: "reps" },
      { name: "Push-ups", target: "12 reps", defaultReps: 12, kind: "reps" },
      { name: "Farmer carry", target: "40 kroků", defaultReps: 40, kind: "distance" },
      { name: "Wall balls", target: "15 reps", defaultReps: 15, kind: "reps" },
      { name: "Deadlift", target: "12 reps", defaultReps: 12, kind: "reps" },
      { name: "Burpees", target: "8 reps", defaultReps: 8, kind: "reps" },
    ],
  },
};

function parseNaturalNumber(value: string): number {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function segmentLabel(wod: LiveWodDefinition, completed: number): string {
  if (wod.key === "angie" || wod.key === "bw_angie") return angieProgressLabel(completed);
  if (wod.key === "andi") return andiProgressLabel(completed);
  const t = totalTargetReps(wod);
  if (wod.liveFinishAnytime && (t >= UNCAPPED_REPS_THRESHOLD || /amrap/i.test(wod.scoreType))) {
    return /amrap/i.test(wod.scoreType)
      ? `${completed} dokončených opakování (AMRAP)`
      : `${completed} dokončených opakování (žádný pevný cíl v aplikaci — skóre dle WodWell)`;
  }
  return `${completed} / ${t}`;
}

/** Detail průběhu (Angie/ANDI) — pod velkým počítadlem. */
function repProgressDetail(wod: LiveWodDefinition, completed: number): string | null {
  if (wod.key === "angie" || wod.key === "bw_angie") return angieProgressLabel(completed);
  if (wod.key === "andi") return andiProgressLabel(completed);
  return null;
}

function CrossfitLoadBlock({
  wod,
  userLoad,
  onChange,
  idSuffix,
}: {
  wod: LiveWodDefinition;
  userLoad: string;
  onChange: (v: string) => void;
  idSuffix: string;
}) {
  return (
    <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-950/25 px-3 py-3">
      {wod.rxLoadDescription ? (
        <p className="text-sm leading-snug text-zinc-200">
          <span className="font-semibold text-emerald-400/95">Rx / nářadí:</span>{" "}
          <span className="text-zinc-300">{wod.rxLoadDescription}</span>
        </p>
      ) : (
        <p className="text-xs text-zinc-500">Čistě vlastní váha těla — můžeš zapsat gumy, úpravy shybů apod.</p>
      )}
      <label htmlFor={`crossfit-load-${idSuffix}`} className="mt-2 block text-xs font-medium text-zinc-400">
        S čím jsem cvičil/a
      </label>
      <input
        id={`crossfit-load-${idSuffix}`}
        type="text"
        value={userLoad}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          wod.rxLoadDescription
            ? "např. přesně Rx, nebo 6 kg míč, 75 lb thruster…"
            : "např. shyby na gumě, kliky na bradlech…"
        }
        className={`${formInputClass} mt-1`}
        autoComplete="off"
      />
    </div>
  );
}

export function LiveTrainingFlow() {
  const [sport, setSport] = useState<LiveSportCategory>("crossfit");
  /** Benchmark „Girl/Hero“ vs CrossFit Open. */
  const [cfKind, setCfKind] = useState<"benchmark" | "open">("benchmark");
  const [openYear, setOpenYear] = useState<OpenSeasonYear>(OPEN_SEASON_YEAR_ORDER[0]);
  const [wodKey, setWodKey] = useState<LiveWodKey | null>(null);
  const [freeWorkoutMode, setFreeWorkoutMode] = useState(false);
  const [hyroxVariantKey, setHyroxVariantKey] = useState<HyroxVariantDef["key"] | null>(null);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [activeOpen, setActiveOpen] = useState(false);
  const [completedReps, setCompletedReps] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [userLoadInput, setUserLoadInput] = useState("");
  const [bearRoundWeights, setBearRoundWeights] = useState<string[]>(() => Array.from({ length: 5 }, () => ""));
  const [freeWorkoutSets, setFreeWorkoutSets] = useState<Array<{ reps: string; weight: string }>>(
    () => Array.from({ length: 10 }, () => ({ reps: "", weight: "" })),
  );
  const [hyroxCurrentRound, setHyroxCurrentRound] = useState(1);
  const [hyroxCurrentStep, setHyroxCurrentStep] = useState(0);
  const [hyroxStepActual, setHyroxStepActual] = useState("");
  const [hyroxStepLoad, setHyroxStepLoad] = useState("");
  const [hyroxLog, setHyroxLog] = useState<Array<{ round: number; step: string; target: string; actual: string; load: string }>>([]);
  const [hyroxSetup, setHyroxSetup] = useState({
    bodyWeightKg: "",
    heightCm: "",
    farmerCarry: "",
    wallBall: "",
    deadlift: "",
    shinSensitive: false,
  });

  const [bbProgram, setBbProgram] = useState<BodybuildingProgramKey | null>(null);
  const [bbRestVariant, setBbRestVariant] = useState<TenByTenRestVariant>("manual10");
  const [bbEquipmentIds, setBbEquipmentIds] = useState<BodybuildingEquipmentId[]>([]);
  const [bbMuscleGroup, setBbMuscleGroup] = useState("");
  const [bbExercise, setBbExercise] = useState("");
  const [bbWeightKg, setBbWeightKg] = useState("");
  const [bbSetsConfirmed, setBbSetsConfirmed] = useState(0);
  const [bbSetBaselineReps, setBbSetBaselineReps] = useState(0);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restRemainingMs, setRestRemainingMs] = useState(0);

  const selectedWod = wodKey ? LIVE_WODS[wodKey] : null;
  const wod = freeWorkoutMode ? FREE_WORKOUT_WOD : selectedWod;
  const hyroxVariant = hyroxVariantKey ? HYROX_VARIANTS[hyroxVariantKey] : null;
  const hyroxTotalSteps = hyroxVariant ? hyroxVariant.rounds * hyroxVariant.steps.length : 0;
  const hyroxDoneSteps = hyroxLog.length;
  const sessionName =
    hyroxVariant?.name ??
    (sport === "bodybuilding" && bbProgram
      ? `${bbProgram === "1x100" ? "1×100" : "10×10"} · ${bbExercise || "—"}`
      : wod?.name);
  const target = wod ? totalTargetReps(wod) : 0;
  const hideRepRemaining =
    wod?.liveFinishAnytime === true &&
    (target >= UNCAPPED_REPS_THRESHOLD || /amrap/i.test(wod.scoreType));
  const canFinishSession = Boolean(
    hyroxVariant
      ? hyroxDoneSteps > 0
      : sport === "bodybuilding" && bbProgram
        ? completedReps > 0 || bbSetsConfirmed > 0
        : wod && (wod.liveFinishAnytime || target === 0 || completedReps >= target),
  );

  useEffect(() => {
    if (cfKind !== "open" || wodKey == null) return;
    const allowed = OPEN_WOD_KEYS_BY_YEAR[openYear];
    if (!(allowed as readonly string[]).includes(wodKey)) {
      setWodKey(null);
    }
  }, [cfKind, openYear, wodKey]);

  useEffect(() => {
    setUserLoadInput("");
    setBearRoundWeights(Array.from({ length: 5 }, () => ""));
    setFreeWorkoutSets(Array.from({ length: 10 }, () => ({ reps: "", weight: "" })));
    if (hyroxVariant) {
      setHyroxSetup({
        bodyWeightKg: "",
        heightCm: "",
        farmerCarry: hyroxVariant.defaults.farmerCarry,
        wallBall: hyroxVariant.defaults.wallBall,
        deadlift: hyroxVariant.defaults.deadlift,
        shinSensitive: hyroxVariant.defaults.shinFriendly,
      });
      setHyroxCurrentRound(1);
      setHyroxCurrentStep(0);
      setHyroxStepActual("");
      setHyroxStepLoad("");
      setHyroxLog([]);
    }
  }, [wodKey, sport, hyroxVariantKey, hyroxVariant]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      if (startedAtRef.current == null) return;
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 250);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (restEndsAt == null) {
      setRestRemainingMs(0);
      return;
    }
    const tick = () => {
      const left = restEndsAt - Date.now();
      setRestRemainingMs(Math.max(0, left));
      if (left <= 0) setRestEndsAt(null);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [restEndsAt]);

  const startTimer = () => {
    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now();
      setElapsedMs(0);
    }
    setRunning(true);
  };

  const pauseTimer = () => setRunning(false);

  const resetSession = () => {
    setRunning(false);
    startedAtRef.current = null;
    setElapsedMs(0);
    setCompletedReps(0);
    setActiveOpen(false);
    setUserLoadInput("");
    setBearRoundWeights(Array.from({ length: 5 }, () => ""));
    setFreeWorkoutSets(Array.from({ length: 10 }, () => ({ reps: "", weight: "" })));
    setHyroxCurrentRound(1);
    setHyroxCurrentStep(0);
    setHyroxStepActual("");
    setHyroxStepLoad("");
    setHyroxLog([]);
    setBbSetsConfirmed(0);
    setBbSetBaselineReps(0);
    setRestEndsAt(null);
  };

  const setBearRoundWeight = (idx: number, value: string) => {
    setBearRoundWeights((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  const addReps = (n: number) => {
    if (sport === "bodybuilding" && bbProgram && (bbProgram === "1x100" || bbProgram === "10x10")) {
      setCompletedReps((c) => Math.min(BB_TARGET_REPS, c + n));
      return;
    }
    if (!wod) return;
    if (target > 0) {
      setCompletedReps((c) => Math.min(target, c + n));
      return;
    }
    setCompletedReps((c) => c + n);
  };

  const undoLast = useRef<number[]>([]);
  const addRepsTracked = (n: number) => {
    undoLast.current.push(n);
    addReps(n);
  };

  const undo = () => {
    const last = undoLast.current.pop();
    if (last == null) return;
    setCompletedReps((c) => Math.max(0, c - last));
  };

  const toggleBbEquipment = (id: BodybuildingEquipmentId) => {
    setBbEquipmentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const confirmTenByTenSet = () => {
    if (sport !== "bodybuilding" || bbProgram !== "10x10") return;
    if (restEndsAt != null) return;
    if (completedReps - bbSetBaselineReps < 10) return;
    const next = bbSetsConfirmed + 1;
    setBbSetsConfirmed(next);
    setBbSetBaselineReps(completedReps);
    if (next < 10) {
      if (bbRestVariant === "count30") setRestEndsAt(Date.now() + 30_000);
      if (bbRestVariant === "count60") setRestEndsAt(Date.now() + 60_000);
    }
  };

  const skipRestCountdown = () => setRestEndsAt(null);

  const confirmHyroxStep = () => {
    if (!hyroxVariant) return;
    const stepDef = hyroxVariant.steps[hyroxCurrentStep];
    if (!stepDef) return;
    const actual = hyroxStepActual.trim();
    const load = hyroxStepLoad.trim();
    const actualNumber = parseNaturalNumber(actual);
    if (actualNumber > 0) {
      setCompletedReps((c) => c + actualNumber);
    } else if (stepDef.defaultReps > 0) {
      setCompletedReps((c) => c + stepDef.defaultReps);
    }
    setHyroxLog((prev) => [
      ...prev,
      {
        round: hyroxCurrentRound,
        step: stepDef.name,
        target: stepDef.target,
        actual: actual || String(stepDef.defaultReps),
        load,
      },
    ]);

    if (hyroxCurrentStep < hyroxVariant.steps.length - 1) {
      setHyroxCurrentStep((s) => s + 1);
    } else {
      setHyroxCurrentStep(0);
      setHyroxCurrentRound((r) => Math.min(hyroxVariant.rounds, r + 1));
    }
    setHyroxStepActual("");
    setHyroxStepLoad("");
  };

  const finishAndSave = useCallback(() => {
    if (!wod && !hyroxVariant && !(sport === "bodybuilding" && bbProgram)) return;
    const durationSec = Math.floor(elapsedMs / 1000);
    const loadTrim = userLoadInput.trim();
    const bbEquipSummary = bbEquipmentIds
      .map((id) => BODYBUILDING_EQUIPMENT.find((e) => e.id === id)?.label)
      .filter(Boolean)
      .join(", ");
    const bbRestLabel =
      bbRestVariant === "manual10"
        ? "10 s (bez odpočtu, jen potvrzení série)"
        : bbRestVariant === "count30"
          ? "30 s odpočet"
          : "1 min odpočet";
    const bearSeriesSummary =
      wod?.key === "bear_complex"
        ? bearRoundWeights
            .map((w, idx) => ({ idx, w: w.trim() }))
            .filter((x) => x.w.length > 0)
            .map((x) => `S${x.idx + 1}: ${x.w}`)
            .join(" | ")
        : "";
    const freeSetSummary = freeWorkoutMode
      ? freeWorkoutSets
          .map((s, idx) => ({
            idx,
            reps: s.reps.trim(),
            weight: s.weight.trim(),
          }))
          .filter((x) => x.reps || x.weight)
          .map((x) => `S${x.idx + 1}: ${x.reps || "-"} reps @ ${x.weight || "-"}`)
          .join(" | ")
      : "";
    const hyroxSummary = hyroxVariant
      ? hyroxLog
          .map((x) => `R${x.round} ${x.step}: ${x.actual}${x.load ? ` @ ${x.load}` : ""}`)
          .join(" | ")
      : "";
    const hyroxSetupSummary = hyroxVariant
      ? `Vstup: váha ${hyroxSetup.bodyWeightKg || "?"} kg, výška ${hyroxSetup.heightCm || "?"} cm, farmer ${hyroxSetup.farmerCarry || "-"}, wall ball ${hyroxSetup.wallBall || "-"}, deadlift ${hyroxSetup.deadlift || "-"}, holeně citlivé: ${hyroxSetup.shinSensitive ? "ano" : "ne"}.`
      : "";
    const sessionLabel =
      hyroxVariant?.name ??
      (sport === "bodybuilding" && bbProgram
        ? `Bodybuilding ${bbProgram === "1x100" ? "1×100" : `10×10 (${bbRestLabel})`}`
        : wod?.name ?? "Živý trénink");
    const bbNotes =
      sport === "bodybuilding" && bbProgram
        ? [
            ` Partie: ${bbMuscleGroup || "—"}. Cvik: ${bbExercise || "—"}.`,
            bbWeightKg.trim() ? ` Váha: ${bbWeightKg.trim()} kg.` : "",
            bbEquipSummary ? ` Nářadí: ${bbEquipSummary}.` : "",
            bbProgram === "10x10" ? ` Potvrzené série: ${bbSetsConfirmed}/10.` : "",
          ].join("")
        : "";
    const entry = saveLiveWorkoutLog({
      sportCategory: sport,
      wodKey: freeWorkoutMode ? undefined : (wodKey ?? undefined),
      wodName: sessionLabel,
      durationSec,
      repsCompleted: completedReps,
      repsTarget:
        sport === "bodybuilding" && bbProgram
          ? BB_TARGET_REPS
          : target >= UNCAPPED_REPS_THRESHOLD
            ? 0
            : target,
      notes: [
        `Živý trénink — ${sessionLabel}. Čas ${formatElapsed(elapsedMs)}.`,
        loadTrim ? ` Použité váhy / škálování: ${loadTrim}.` : "",
        bearSeriesSummary ? ` Série Bear Complex: ${bearSeriesSummary}.` : "",
        freeSetSummary ? ` Série Free Workout: ${freeSetSummary}.` : "",
        hyroxSetupSummary,
        hyroxSummary ? ` Kroky HYROX: ${hyroxSummary}.` : "",
        bbNotes,
      ].join(""),
      loadUsed: loadTrim || bbWeightKg.trim() || undefined,
    });
    setSaveMessage(
      `Uloženo lokálně (${entry.wodName}, ${formatElapsed(elapsedMs)}). Doplň hlavní záznam tréninku v Importech nebo v Trénink.`,
    );
    resetSession();
    setWodKey(null);
    setBbProgram(null);
    setBbEquipmentIds([]);
    setBbMuscleGroup("");
    setBbExercise("");
    setBbWeightKg("");
    void fetch("/api/live-workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(() => undefined);
  }, [
    sport,
    userLoadInput,
    bearRoundWeights,
    freeWorkoutMode,
    freeWorkoutSets,
    hyroxVariant,
    hyroxLog,
    hyroxSetup,
    wod,
    wodKey,
    elapsedMs,
    completedReps,
    target,
    bbProgram,
    bbEquipmentIds,
    bbMuscleGroup,
    bbExercise,
    bbWeightKg,
    bbSetsConfirmed,
    bbRestVariant,
  ]);

  const openActive = () => {
    if (!wod && !hyroxVariant) return;
    setCompletedReps(0);
    undoLast.current = [];
    startedAtRef.current = null;
    setElapsedMs(0);
    setRunning(false);
    if (hyroxVariant) {
      setHyroxCurrentRound(1);
      setHyroxCurrentStep(0);
      setHyroxStepActual("");
      setHyroxStepLoad("");
      setHyroxLog([]);
    }
    setActiveOpen(true);
  };

  const openBodybuildingLive = () => {
    if (!bbProgram || !bbMuscleGroup.trim() || !bbExercise.trim()) return;
    setCompletedReps(0);
    undoLast.current = [];
    startedAtRef.current = null;
    setElapsedMs(0);
    setRunning(false);
    setBbSetsConfirmed(0);
    setBbSetBaselineReps(0);
    setRestEndsAt(null);
    setActiveOpen(true);
  };

  const bbExerciseOptions = bbMuscleGroup ? BODYBUILDING_MUSCLE_GROUPS[bbMuscleGroup] ?? [] : [];

  const sportOptions = useMemo(
    () =>
      [
        { id: "crossfit" as const, label: "CrossFit", hint: "Benchmark nebo Open" },
        { id: "hyrox" as const, label: "HYROX", hint: "4 domácí varianty + krokový tracker" },
        { id: "bodybuilding" as const, label: "Bodybuilding", hint: "1×100, 10×10, partie, cviky" },
        { id: "bodyweight" as const, label: "Bodyweight", hint: "Girl / benchmark bez činky" },
      ] as const,
    [],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="text-base font-semibold text-zinc-100">1. Typ tréninku</h3>
        <p className="mb-3 text-xs text-ew-muted">Podle typu se mění nástroje a nápověda.</p>
        <div className="flex flex-wrap gap-2">
          {sportOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setSport(o.id);
                setCfKind("benchmark");
                setWodKey(null);
                setFreeWorkoutMode(false);
                setHyroxVariantKey(null);
                setBbProgram(null);
                setBbEquipmentIds([]);
                setBbMuscleGroup("");
                setBbExercise("");
                setBbWeightKg("");
                resetSession();
              }}
              className={`rounded-lg border px-4 py-2 text-sm transition ${
                sport === o.id
                  ? "border-ew-blue-light bg-ew-bg text-white ring-1 ring-ew-blue-light"
                  : "border-ew-border text-zinc-400 hover:border-zinc-500"
              }`}
            >
              <span className="font-medium">{o.label}</span>
              <span className="ml-2 text-xs text-ew-muted">{o.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {sport === "crossfit" && (
        <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <h3 className="text-base font-semibold text-zinc-100">2. CrossFit — výběr WOD</h3>
          <p className="mb-3 text-xs text-ew-muted">
            Benchmarky (Girl/Hero) nebo závodní předpis Open. Předpis a orientační info jako na WodWell.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCfKind("benchmark");
                setWodKey(null);
                setFreeWorkoutMode(false);
                setActiveOpen(false);
              }}
              className={`rounded-lg border px-3 py-2 text-sm ${
                cfKind === "benchmark"
                  ? "border-ew-blue-light bg-ew-bg text-white"
                  : "border-ew-border text-zinc-400 hover:border-zinc-500"
              }`}
            >
              Benchmark
            </button>
            <button
              type="button"
              onClick={() => {
                setCfKind("open");
                setOpenYear(OPEN_SEASON_YEAR_ORDER[0]);
                setWodKey(null);
                setFreeWorkoutMode(false);
                setActiveOpen(false);
              }}
              className={`rounded-lg border px-3 py-2 text-sm ${
                cfKind === "open"
                  ? "border-ew-blue-light bg-ew-bg text-white"
                  : "border-ew-border text-zinc-400 hover:border-zinc-500"
              }`}
            >
              Open
            </button>
          </div>
          {cfKind === "open" && (
            <div className="mb-3">
              <label className="mb-2 block text-xs font-medium text-zinc-400" htmlFor="open-year-select">
                Ročník (Open, {OPEN_YEAR_MIN}–{OPEN_SEASON_YEAR_ORDER[0]})
              </label>
              <select
                id="open-year-select"
                value={openYear}
                onChange={(e) => {
                  setOpenYear(Number(e.target.value) as OpenSeasonYear);
                  setWodKey(null);
                  setActiveOpen(false);
                }}
                className="w-full max-w-xs rounded-lg border border-ew-border bg-ew-bg px-3 py-2 text-sm text-white"
              >
                {OPEN_SEASON_YEAR_ORDER.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-ew-muted">
                Pro každý rok 2011+ jsou tři workouty (odkaz na WodWell). Rok {OPEN_YEAR_MIN}: formát Open ještě neexistoval.
              </p>
            </div>
          )}
          {cfKind === "open" && OPEN_WOD_KEYS_BY_YEAR[openYear].length === 0 ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-sm text-amber-100/90">
              CrossFit Open začalo v roce 2011 — zvol rok 2011 nebo novější a zobrazí se Open 1–3.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cfKind === "benchmark" && (
                <button
                  type="button"
                  onClick={() => {
                    setFreeWorkoutMode(true);
                    setWodKey(null);
                    setActiveOpen(false);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    freeWorkoutMode
                      ? "border-ew-blue-light bg-ew-bg text-white"
                      : "border-ew-border text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  Free Workout
                </button>
              )}
              {(cfKind === "benchmark" ? CROSSFIT_WOD_ORDER : OPEN_WOD_KEYS_BY_YEAR[openYear]).map(
                (key: LiveWodKey) => {
                  const def = LIVE_WODS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setFreeWorkoutMode(false);
                        setWodKey(key);
                        setActiveOpen(false);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        !freeWorkoutMode && wodKey === key
                          ? "border-ew-blue-light bg-ew-bg text-white"
                          : "border-ew-border text-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      {def.name}
                    </button>
                  );
                },
              )}
            </div>
          )}
          {wod && (
            <div className="mt-4 flex flex-wrap gap-2">
              {!freeWorkoutMode && (
                <button
                  type="button"
                  onClick={() => setPrescriptionOpen(true)}
                  className="rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-ew-blue-light hover:border-ew-blue-light"
                >
                  Zobrazit předpis a časy
                </button>
              )}
              <button
                type="button"
                onClick={openActive}
                className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
              >
                Spustit čas + počítadlo
              </button>
            </div>
          )}
        </section>
      )}

      {sport === "hyrox" && (
        <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <h3 className="text-base font-semibold text-zinc-100">2. HYROX — výběr varianty</h3>
          <p className="mb-3 text-xs text-ew-muted">
            Vyber variantu, nastav vstupní váhy/míry a potvrzuj postupně každý krok. Počítadlo rep funguje ručně i přes potvrzení kroku.
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(HYROX_VARIANTS) as HyroxVariantDef["key"][]).map((k) => {
              const v = HYROX_VARIANTS[k];
              const selected = hyroxVariantKey === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setHyroxVariantKey(k);
                    setWodKey(null);
                    setFreeWorkoutMode(false);
                    setActiveOpen(false);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm ${selected ? "border-ew-blue-light bg-ew-bg text-white" : "border-ew-border text-zinc-300 hover:border-zinc-500"}`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>

          {hyroxVariant && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-ew-border bg-ew-bg p-3">
                <p className="text-sm font-semibold text-zinc-200">{hyroxVariant.name}</p>
                <p className="mt-1 text-xs text-zinc-400">{hyroxVariant.summary}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Cíl: {hyroxVariant.goalTime} · Odhad: {hyroxVariant.kcalRange} · Kola: {hyroxVariant.rounds}
                </p>
                <ul className="mt-3 space-y-1 text-xs text-zinc-300">
                  {hyroxVariant.steps.map((s) => (
                    <li key={s.name}>
                      • {s.name}: <span className="text-zinc-400">{s.target}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-ew-border bg-ew-bg p-3">
                <p className="mb-2 text-sm font-semibold text-zinc-200">Vstupní váhy a míry</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={hyroxSetup.bodyWeightKg}
                    onChange={(e) => setHyroxSetup((p) => ({ ...p, bodyWeightKg: e.target.value }))}
                    placeholder="Váha (kg)"
                    className={formInputClass}
                  />
                  <input
                    type="text"
                    value={hyroxSetup.heightCm}
                    onChange={(e) => setHyroxSetup((p) => ({ ...p, heightCm: e.target.value }))}
                    placeholder="Výška (cm)"
                    className={formInputClass}
                  />
                  <input
                    type="text"
                    value={hyroxSetup.farmerCarry}
                    onChange={(e) => setHyroxSetup((p) => ({ ...p, farmerCarry: e.target.value }))}
                    placeholder="Farmer carry"
                    className={formInputClass}
                  />
                  <input
                    type="text"
                    value={hyroxSetup.wallBall}
                    onChange={(e) => setHyroxSetup((p) => ({ ...p, wallBall: e.target.value }))}
                    placeholder="Wall ball"
                    className={formInputClass}
                  />
                  <input
                    type="text"
                    value={hyroxSetup.deadlift}
                    onChange={(e) => setHyroxSetup((p) => ({ ...p, deadlift: e.target.value }))}
                    placeholder="Deadlift"
                    className={formInputClass}
                  />
                  <label className="flex items-center gap-2 rounded-md border border-ew-border px-3 py-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={hyroxSetup.shinSensitive}
                      onChange={(e) => setHyroxSetup((p) => ({ ...p, shinSensitive: e.target.checked }))}
                    />
                    Citlivé holeně dnes
                  </label>
                </div>
              </div>
            </div>
          )}

          {hyroxVariant && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openActive}
                className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
              >
                Spustit HYROX tracker
              </button>
            </div>
          )}
        </section>
      )}

      {sport === "bodyweight" && (
        <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <h3 className="text-base font-semibold text-zinc-100">2. Bodyweight — výběr WOD</h3>
          <p className="mb-3 text-xs text-ew-muted">
            Klasické benchmarky jen s vlastní vahou (WodWell). Blackjack, Cindy, Chelsea, Angie, Barbara, Annie, Tabata,
            Death by Burpees, Pukie Brewster, Burpee Hour.
          </p>
          <div className="flex flex-wrap gap-2">
            {BODYWEIGHT_WOD_ORDER.map((key) => {
              const def = LIVE_WODS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setWodKey(key);
                    setActiveOpen(false);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    wodKey === key
                      ? "border-ew-blue-light bg-ew-bg text-white"
                      : "border-ew-border text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {def.name}
                </button>
              );
            })}
          </div>
          {wod && sport === "bodyweight" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrescriptionOpen(true)}
                className="rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-ew-blue-light hover:border-ew-blue-light"
              >
                Zobrazit předpis a časy
              </button>
              <button
                type="button"
                onClick={openActive}
                className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
              >
                Spustit čas + počítadlo
              </button>
            </div>
          )}
        </section>
      )}

      {sport === "bodybuilding" && (
        <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <h3 className="text-base font-semibold text-zinc-100">2. Bodybuilding — typ a nastavení</h3>
          <p className="mb-3 text-xs text-ew-muted">
            Vyber formát, nářadí, svalovou partii a cvik. Časovač a počítadlo (+1 / +3 / +5 / +10) jako u CrossFit. U 10×10 po
            každé sérii potvrď dokončení — u pauzy 30 s a 1 min poběží odpočet.
          </p>

          <p className="mb-2 text-xs font-medium text-zinc-400">Formát</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                { key: "1x100" as const, title: "1×100", desc: "100 op. v sérii / bloku" },
                { key: "10x10" as const, title: "10×10", desc: "10 sérií × 10 op." },
              ] as const
            ).map((row) => (
              <button
                key={row.key}
                type="button"
                onClick={() => {
                  setBbProgram(row.key);
                  setActiveOpen(false);
                }}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  bbProgram === row.key
                    ? "border-ew-blue-light bg-ew-bg text-white"
                    : "border-ew-border text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <span className="font-semibold">{row.title}</span>
                <span className="ml-2 text-xs text-ew-muted">{row.desc}</span>
              </button>
            ))}
          </div>

          {bbProgram === "10x10" && (
            <div className="mb-4 rounded-lg border border-ew-border bg-ew-bg p-3">
              <p className="mb-2 text-xs font-medium text-zinc-400">Pauza mezi sériemi (po potvrzení)</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: "manual10" as const, label: "10 s", sub: "bez odpočtu v aplikaci" },
                    { id: "count30" as const, label: "30 s", sub: "odpočet" },
                    { id: "count60" as const, label: "1 min", sub: "odpočet" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBbRestVariant(opt.id)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      bbRestVariant === opt.id
                        ? "border-amber-500/60 bg-amber-950/30 text-amber-100"
                        : "border-ew-border text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {opt.label}
                    <span className="ml-1 text-xs text-ew-muted">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 grid gap-3 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="bb-muscle">
                Svalová partie
              </label>
              <select
                id="bb-muscle"
                value={bbMuscleGroup}
                onChange={(e) => {
                  const m = e.target.value;
                  setBbMuscleGroup(m);
                  const list = BODYBUILDING_MUSCLE_GROUPS[m] ?? [];
                  setBbExercise(list[0] ?? "");
                }}
                className="w-full rounded-lg border border-ew-border bg-ew-bg px-3 py-2 text-sm text-white"
              >
                <option value="">— zvol partii —</option>
                {BODYBUILDING_MUSCLE_ORDER.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="bb-exercise">
                Cvik
              </label>
              <select
                id="bb-exercise"
                value={bbExercise}
                onChange={(e) => setBbExercise(e.target.value)}
                disabled={!bbMuscleGroup}
                className="w-full rounded-lg border border-ew-border bg-ew-bg px-3 py-2 text-sm text-white disabled:opacity-40"
              >
                <option value="">— zvol cvik —</option>
                {bbExerciseOptions.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-zinc-400" htmlFor="bb-weight">
              Váha (kg) — volitelné
            </label>
            <input
              id="bb-weight"
              type="text"
              inputMode="decimal"
              value={bbWeightKg}
              onChange={(e) => setBbWeightKg(e.target.value)}
              placeholder="např. 60"
              className={`${formInputClass} max-w-xs`}
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-zinc-400">Nářadí (lze více)</p>
            <div className="flex flex-wrap gap-2">
              {BODYBUILDING_EQUIPMENT.map((eq) => {
                const on = bbEquipmentIds.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleBbEquipment(eq.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      on
                        ? "border-sky-500/70 bg-sky-950/40 text-sky-100"
                        : "border-ew-border text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {eq.label}
                  </button>
                );
              })}
            </div>
          </div>

          {bbProgram && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openBodybuildingLive}
                disabled={!bbMuscleGroup.trim() || !bbExercise.trim()}
                className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark disabled:opacity-40"
              >
                Spustit čas + počítadlo
              </button>
            </div>
          )}
        </section>
      )}

      {prescriptionOpen && wod && !freeWorkoutMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="wod-prescription-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-ew-border bg-ew-panel p-4 shadow-xl">
            <h3 id="wod-prescription-title" className="text-lg font-semibold text-white">
              {wod.name}
            </h3>
            <p className="text-xs uppercase tracking-wide text-ew-muted">{wod.subtitle}</p>
            <p className="mt-2 text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">{wod.scoreType}</span>
              {wod.timeCapMin != null && (
                <span className="ml-2 rounded bg-amber-500/15 px-2 py-0.5 text-amber-200/90">
                  cap {wod.timeCapMin} min
                </span>
              )}{" "}
              · {wod.prescription}
            </p>
            <p className="mt-3 text-sm text-zinc-300">{wod.description}</p>
            {sport === "crossfit" && (
              <CrossfitLoadBlock
                wod={wod}
                userLoad={userLoadInput}
                onChange={setUserLoadInput}
                idSuffix="rx"
              />
            )}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-ew-muted">Orientační časy</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                {wod.benchmarks.map((b) => (
                  <li key={b.level}>
                    <span className="text-ew-muted">{b.level}:</span> {b.timeRange}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-xs text-ew-muted">
              Oficiální detail a diskuze:{" "}
              <a href={wod.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-ew-blue-light underline">
                WodWell — {wod.name}
              </a>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrescriptionOpen(false)}
                className="rounded-md border border-ew-border px-3 py-2 text-sm text-zinc-200"
              >
                Zavřít
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrescriptionOpen(false);
                  openActive();
                }}
                className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
              >
                Pokračovat na čas a opakování
              </button>
            </div>
          </div>
        </div>
      )}

      {activeOpen && (wod || hyroxVariant || (sport === "bodybuilding" && bbProgram)) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="live-session-title"
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-ew-border bg-ew-bg p-4 shadow-xl">
            <h3 id="live-session-title" className="text-lg font-semibold text-white">
              {sessionName} — živý průběh
            </h3>
            {sport === "bodybuilding" && bbProgram && (
              <div className="mt-3 rounded-lg border border-violet-500/25 bg-violet-950/20 px-3 py-3 text-sm text-zinc-300">
                <p>
                  <span className="font-semibold text-violet-300">Partie:</span> {bbMuscleGroup || "—"}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-violet-300">Cvik:</span> {bbExercise || "—"}
                </p>
                {bbWeightKg.trim() ? (
                  <p className="mt-1">
                    <span className="font-semibold text-violet-300">Váha:</span> {bbWeightKg.trim()} kg
                  </p>
                ) : null}
                {bbEquipmentIds.length > 0 ? (
                  <p className="mt-1 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-500">Nářadí:</span>{" "}
                    {bbEquipmentIds
                      .map((id) => BODYBUILDING_EQUIPMENT.find((e) => e.id === id)?.label)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                ) : null}
              </div>
            )}
            {sport === "crossfit" && wod && (
              <CrossfitLoadBlock
                wod={wod}
                userLoad={userLoadInput}
                onChange={setUserLoadInput}
                idSuffix="live"
              />
            )}

            {!hyroxVariant &&
              (() => {
                const bbLive = sport === "bodybuilding" && bbProgram;
                if (!wod && !bbLive) return null;
                const repTarget = bbLive ? BB_TARGET_REPS : wod ? totalTargetReps(wod) : 0;
                const repRem = Math.max(0, repTarget - completedReps);
                const detail = wod ? repProgressDetail(wod, completedReps) : null;
                const showBigFraction =
                  repTarget > 0 && repTarget < UNCAPPED_REPS_THRESHOLD && (bbLive || !hideRepRemaining);
                const subline = bbLive
                  ? bbProgram === "10x10"
                    ? `Součet: ${completedReps} / ${BB_TARGET_REPS} · Série potvrzeno: ${bbSetsConfirmed}/10 · v této sérii: ${completedReps - bbSetBaselineReps}/10`
                    : `${completedReps} / ${BB_TARGET_REPS}`
                  : detail ?? (!showBigFraction && wod ? segmentLabel(wod, completedReps) : null);
                return (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-ew-border bg-ew-panel p-4 text-center">
                      <p className="text-xs text-ew-muted">Čas (od startu)</p>
                      <p className="font-mono text-4xl font-bold text-white tabular-nums">
                        {formatElapsed(elapsedMs)}
                      </p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={startTimer}
                          disabled={running}
                          className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                        >
                          Zahájit / pokračovat v čase
                        </button>
                        <button
                          type="button"
                          onClick={pauseTimer}
                          disabled={!running}
                          className="rounded-md border border-ew-border px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
                        >
                          Pauza
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-ew-border bg-ew-panel p-4 text-center">
                      <p className="text-xs text-ew-muted">Počítadlo</p>
                      {showBigFraction ? (
                        <>
                          <p className="font-mono text-4xl font-bold text-white tabular-nums">
                            {completedReps}
                            <span className="text-zinc-500"> / </span>
                            {repTarget}
                          </p>
                          {repRem > 0 && (
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-sky-400/95">
                              zbývá {repRem}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="font-mono text-4xl font-bold text-white tabular-nums">{completedReps}</p>
                      )}
                      {subline && (
                        <p className="mt-3 text-sm leading-snug text-zinc-400">{subline}</p>
                      )}
                    </div>
                  </div>
                );
              })()}

            {sport === "bodybuilding" && bbProgram === "10x10" && (
              <div className="mt-4 space-y-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                {restEndsAt != null && bbRestVariant !== "manual10" && (
                  <div className="rounded-lg border border-amber-500/40 bg-ew-panel px-4 py-3 text-center">
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-200/90">Pauza mezi sériemi</p>
                    <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-amber-100">
                      {formatElapsed(restRemainingMs)}
                    </p>
                    <button
                      type="button"
                      onClick={skipRestCountdown}
                      className="mt-3 rounded-md border border-amber-500/50 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-950/50"
                    >
                      Přeskočit pauzu
                    </button>
                  </div>
                )}
                {bbRestVariant === "manual10" && bbSetsConfirmed < 10 && (
                  <p className="text-center text-xs text-zinc-500">
                    Pauza cca 10 s — čas si hlídáš sám; po dokončení 10 op. v sérii potvrď níže.
                  </p>
                )}
                <button
                  type="button"
                  onClick={confirmTenByTenSet}
                  disabled={
                    restEndsAt != null ||
                    bbSetsConfirmed >= 10 ||
                    completedReps - bbSetBaselineReps < 10
                  }
                  className="w-full rounded-lg bg-amber-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Potvrdit dokončení série ({completedReps - bbSetBaselineReps}/10 op. v této sérii)
                </button>
                {completedReps - bbSetBaselineReps < 10 && bbSetsConfirmed < 10 && (
                  <p className="text-center text-xs text-zinc-500">
                    Přičti opakování tlačítky +1…+10, až bude v aktuální sérii alespoň 10 od posledního potvrzení.
                  </p>
                )}
              </div>
            )}

            {hyroxVariant && (
              <div className="mt-4 space-y-3 rounded-xl border border-ew-border bg-ew-panel p-3">
                <p className="text-xs text-ew-muted">
                  Kolo {Math.min(hyroxCurrentRound, hyroxVariant.rounds)}/{hyroxVariant.rounds} · krok {Math.min(hyroxCurrentStep + 1, hyroxVariant.steps.length)}/{hyroxVariant.steps.length}
                  {" · "}hotovo {hyroxDoneSteps}/{hyroxTotalSteps}
                </p>
                <p className="text-sm font-semibold text-zinc-200">
                  {hyroxVariant.steps[hyroxCurrentStep]?.name} <span className="text-zinc-400">({hyroxVariant.steps[hyroxCurrentStep]?.target})</span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={hyroxStepActual}
                    onChange={(e) => setHyroxStepActual(e.target.value)}
                    placeholder="Skutečnost (reps/metry)"
                    className={formInputClass}
                  />
                  <input
                    type="text"
                    value={hyroxStepLoad}
                    onChange={(e) => setHyroxStepLoad(e.target.value)}
                    placeholder="Váha / pozn."
                    className={formInputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={confirmHyroxStep}
                  disabled={hyroxDoneSteps >= hyroxTotalSteps}
                  className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Potvrdit krok
                </button>
              </div>
            )}

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-zinc-300">Přičíst opakování</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[1, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => addRepsTracked(n)}
                    className="rounded-lg bg-ew-blue px-3 py-4 text-lg font-bold text-white hover:bg-ew-blue-dark"
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={undo}
                className="mt-3 w-full rounded-md border border-ew-border py-2 text-sm text-zinc-300 hover:bg-ew-panel"
              >
                Vrátit poslední přičtení
              </button>
            </div>

            {wod?.key === "bear_complex" && (
              <div className="mt-4 rounded-xl border border-ew-border bg-ew-panel p-3">
                <p className="mb-2 text-sm font-medium text-zinc-200">Bear Complex — série a váha</p>
                <p className="mb-3 text-xs text-zinc-500">Doplň váhu pro jednotlivé série 1–5 (typicky rostoucí).</p>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Série</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Váha</div>
                  {bearRoundWeights.map((weight, idx) => (
                    <Fragment key={idx}>
                      <div className="flex items-center text-sm text-zinc-300">{idx + 1}</div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={weight}
                        onChange={(e) => setBearRoundWeight(idx, e.target.value)}
                        placeholder="např. 40 kg / 88 lb"
                        className={formInputClass}
                      />
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
            {freeWorkoutMode && (
              <div className="mt-4 rounded-xl border border-ew-border bg-ew-panel p-3">
                <p className="mb-2 text-sm font-medium text-zinc-200">Free Workout — série, opakování a váha</p>
                <p className="mb-3 text-xs text-zinc-500">
                  Výchozích 10 sérií. Můžeš postupně přidávat další řádky tlačítkem níže.
                </p>
                <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Série</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Reps</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Váha</div>
                  {freeWorkoutSets.map((setRow, idx) => (
                    <Fragment key={idx}>
                      <div className="flex items-center text-sm text-zinc-300">{idx + 1}</div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={setRow.reps}
                        onChange={(e) =>
                          setFreeWorkoutSets((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, reps: e.target.value } : s)),
                          )
                        }
                        placeholder="např. 10"
                        className={formInputClass}
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={setRow.weight}
                        onChange={(e) =>
                          setFreeWorkoutSets((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, weight: e.target.value } : s)),
                          )
                        }
                        placeholder="např. 60 kg"
                        className={formInputClass}
                      />
                    </Fragment>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFreeWorkoutSets((prev) => [...prev, { reps: "", weight: "" }])}
                  className="mt-3 rounded-md border border-ew-border px-3 py-2 text-sm text-zinc-200 hover:bg-ew-bg"
                >
                  Přidat sérii
                </button>
              </div>
            )}

            {hyroxVariant && hyroxLog.length > 0 && (
              <div className="mt-4 rounded-xl border border-ew-border bg-ew-panel p-3">
                <p className="mb-2 text-sm font-medium text-zinc-200">Potvrzené kroky</p>
                <div className="max-h-40 overflow-auto text-xs text-zinc-300">
                  {hyroxLog.map((x, idx) => (
                    <div key={`${idx}-${x.round}-${x.step}`} className="border-b border-ew-border/60 py-1 last:border-0">
                      R{x.round} · {x.step}: {x.actual} {x.load ? `@ ${x.load}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-ew-border pt-4">
              <button
                type="button"
                onClick={() => {
                  resetSession();
                  setPrescriptionOpen(false);
                }}
                className="rounded-md border border-ew-border px-3 py-2 text-sm text-zinc-300"
              >
                Zrušit session
              </button>
              <button
                type="button"
                disabled={!canFinishSession}
                onClick={finishAndSave}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Dokončit a uložit výsledek
              </button>
            </div>
            <p className="mt-3 text-xs text-ew-muted">
              Uloží se čas, počet opakování a název WOD do lokálního deníku. Hlavní kalorie a délku doplníš importem nebo ručně v Trénink.
            </p>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/50 p-3 text-sm text-emerald-100">
          {saveMessage}{" "}
          <Link href="/training" className="font-medium text-ew-blue-light underline">
            Otevřít Trénink
          </Link>
          .
          <button
            type="button"
            className="ml-2 text-emerald-300 underline"
            onClick={() => setSaveMessage(null)}
          >
            Zavřít
          </button>
        </div>
      )}
    </div>
  );
}
