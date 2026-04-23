"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createWorker, PSM } from "tesseract.js";
import { preprocessImageForOcr } from "@/lib/ocr-preprocess";
import { getRepositories } from "@/lib/repositories/provider";
import { coerceSportType, SPORT_TYPE_OPTIONS } from "@/lib/sport-type";
import type { NutritionEntry, TrainingSession } from "@/lib/types";

type ImportTarget = "training" | "nutrition";

type ParsedData = Record<string, string | number>;

type ImportRecord = {
  id: string;
  created_at: string;
  source_app: string;
  image_name: string;
  import_target: ImportTarget;
  parsed_json: ParsedData;
  status: "draft" | "saved" | "converted";
};

const trainingTemplate: ParsedData = {
  date: new Date().toISOString().slice(0, 10),
  workoutType: "",
  durationMin: 42,
  distanceKm: 0,
  calories: 0,
  averageHeartRate: 0,
  pace: "-",
  elevation: 0,
  effort: "",
  notes: "Import z fitness screenshotu",
};

const nutritionTemplate: ParsedData = {
  date: new Date().toISOString().slice(0, 10),
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  /** Pitný režim nečteme z OCR — doplň ručně podle náhledu. */
  waterLiters: "",
  bodyWeightKg: "",
  notes: "Import z Kalorických tabulek",
};

/** Pořadí polí ve formuláři výživy (Kalorické tabulky: kruhy Kalorie → makra → voda → váha). */
const NUTRITION_FIELD_ORDER = [
  "date",
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "waterLiters",
  "bodyWeightKg",
  "notes",
] as const;

/**
 * iOS z galerie často vrátí prázdný typ nebo HEIC — striktní `image/*` by soubor odmítlo.
 */
function isLikelyImageFile(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  if (/\.(png|jpe?g|gif|webp|heic|heif|bmp|dng)$/i.test(file.name)) return true;
  if (
    (t === "" || t === "application/octet-stream") &&
    file.size > 0 &&
    file.size < 80 * 1024 * 1024
  ) {
    return true;
  }
  return false;
}

const NUTRITION_LABELS_CS: Record<string, string> = {
  date: "Datum",
  calories: "Kalorie (kcal)",
  protein: "Bílkoviny (g)",
  carbs: "Sacharidy (g)",
  fat: "Tuky (g)",
  fiber: "Vláknina (g)",
  waterLiters: "Pitný režim (l)",
  bodyWeightKg: "Hmotnost (kg), volitelně",
  notes: "Poznámka",
};

/** Číslo z pole (včetně desetinné čárky); nikdy NaN. */
function parseLocaleNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!s) return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Délka tréninku v minutách: číslo, nebo „59:57“ / „1:02:30“ (OCR z Apple Fitness apod.).
 * Number("59:57") je NaN → bez tohoto padá NOT NULL na duration_min.
 */
function parseDurationToMinutes(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.max(1, Math.round(value));
  }
  const raw = String(value ?? "").trim();
  if (!raw) return 30;
  if (raw.includes(":")) {
    const nums = raw.split(":").map((x) => parseInt(x.trim(), 10));
    if (nums.some((n) => Number.isNaN(n))) return 30;
    if (nums.length === 3) {
      return Math.max(1, Math.round(nums[0] * 60 + nums[1] + nums[2] / 60));
    }
    if (nums.length === 2 && nums[1] < 60) {
      return Math.max(1, Math.round(nums[0] + nums[1] / 60));
    }
    return 30;
  }
  const n = parseLocaleNumber(raw);
  return n > 0 ? Math.max(1, Math.round(n)) : 30;
}

function buildTrainingFieldsFromParsed(parsedData: ParsedData): Omit<TrainingSession, "id" | "userId"> {
  const sport = coerceSportType(parsedData.workoutType);
  return {
    date: String(parsedData.date ?? new Date().toISOString().slice(0, 10)),
    sportType: sport,
    title: `${sport} (import)`,
    durationMin: parseDurationToMinutes(parsedData.durationMin),
    distanceKm: Math.max(0, Math.round(parseLocaleNumber(parsedData.distanceKm) * 100) / 100),
    avgHeartRate: Math.max(0, Math.round(parseLocaleNumber(parsedData.averageHeartRate))),
    calories: Math.max(0, Math.round(parseLocaleNumber(parsedData.calories))),
    elevation: Math.max(0, Math.round(parseLocaleNumber(parsedData.elevation))),
    pace: String(parsedData.pace ?? "-"),
    effort: String(parsedData.effort || "střední"),
    rpe: 6,
    notes: String(parsedData.notes ?? "Vytvořeno z importu screenshotu"),
  };
}

export function ImportsCenter() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";

  const [sourceApp, setSourceApp] = useState("apple-fitness");
  const [importTarget, setImportTarget] = useState<ImportTarget>("training");
  const [imageName, setImageName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData>(trainingTemplate);
  const [savedImports, setSavedImports] = useState<ImportRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [deletingImportId, setDeletingImportId] = useState<string | null>(null);
  const [writingTrainingFromImportId, setWritingTrainingFromImportId] = useState<string | null>(null);
  const [openImportDetailId, setOpenImportDetailId] = useState<string | null>(null);
  /** Po ruční změně sportu v dropdownu už OCR nepřepisuje workoutType (jinak „Walk“ z fotky přebije CrossFit). */
  const workoutTypeTouchedRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);
  const screenshotFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      const u = previewUrlRef.current;
      if (u) URL.revokeObjectURL(u);
    };
  }, []);

  useEffect(() => {
    void fetch("/api/imports")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { imports: ImportRecord[] };
        setSavedImports(result.imports);
      })
      .catch(() => undefined);
  }, []);

  const autoParseFromScreenshot = useCallback(
    async (file: File, fileUrl: string) => {
      setIsParsing(true);
      setErrorMessage(null);
      try {
        const ocrLang = sourceApp === "calorie-table" ? "ces+eng" : "eng";
        const fileForOcr =
          sourceApp === "calorie-table" && importTarget === "nutrition"
            ? await preprocessImageForOcr(file)
            : file;
        const worker = await createWorker(ocrLang);
        if (importTarget === "nutrition" && sourceApp === "calorie-table") {
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          });
        }
        const {
          data: { text },
        } = await worker.recognize(fileForOcr);
        await worker.terminate();
        const parsed = parseTextToFields(text, importTarget);
        setParsedData((prev) => {
          const { workoutType: inferredWt, ...rest } = parsed;
          const next: ParsedData = { ...prev, ...rest };
          if (!workoutTypeTouchedRef.current && inferredWt !== undefined) {
            next.workoutType = inferredWt;
          }
          return next;
        });
        setMessage("Automatické načtení ze screenshotu dokončeno. Zkontroluj hodnoty.");
        void fileUrl;
      } catch {
        setMessage("Automatické načtení se nepovedlo, použij ruční korekci.");
      } finally {
        setIsParsing(false);
      }
    },
    [sourceApp, importTarget],
  );

  const runImportFromFile = useCallback(
    (file: File) => {
      if (!isLikelyImageFile(file)) {
        setErrorMessage("Vyber prosím obrázek (PNG, JPEG, HEIC, …).");
        return;
      }
      const displayName =
        file.name && file.name.length > 0 && file.name !== "blob"
          ? file.name
          : `vlozeny-screen-${Date.now()}.png`;
      const fileForImport =
        file.name === displayName ? file : new File([file], displayName, { type: file.type || "image/png" });
      setImageName(fileForImport.name);
      workoutTypeTouchedRef.current = false;
      const nextUrl = URL.createObjectURL(fileForImport);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      void autoParseFromScreenshot(fileForImport, nextUrl);
    },
    [autoParseFromScreenshot],
  );

  /** Vložení screenshotu ze schránky (Ctrl+V / Cmd+V) bez ukládání souboru na disk. */
  useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file && isLikelyImageFile(file)) {
          e.preventDefault();
          runImportFromFile(file);
          return;
        }
      }
    };
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [runImportFromFile]);

  const parsedEntries = useMemo(() => {
    if (importTarget === "nutrition") {
      return NUTRITION_FIELD_ORDER.filter((k) => k in parsedData).map(
        (k) => [k, parsedData[k]] as [string, string | number],
      );
    }
    return Object.entries(parsedData);
  }, [importTarget, parsedData]);

  const onFileChange = (file: File | null) => {
    if (!file) return;
    runImportFromFile(file);
    if (screenshotFileInputRef.current) {
      screenshotFileInputRef.current.value = "";
    }
  };

  const onParsedValueChange = (key: string, value: string) => {
    if (key === "workoutType") {
      workoutTypeTouchedRef.current = true;
      setParsedData((prev) => ({ ...prev, workoutType: coerceSportType(value) }));
      return;
    }
    const numeric = Number(value);
    setParsedData((prev) => ({
      ...prev,
      [key]: Number.isNaN(numeric) || value.trim() === "" ? value : numeric,
    }));
  };

  const persistTrainingFromParsed = useCallback(
    async (data: ParsedData): Promise<{ ok: true } | { ok: false; error: string }> => {
      const fields = buildTrainingFieldsFromParsed(data);
      if (useSupabase) {
        const response = await fetch("/api/training", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "u1", ...fields }),
        });
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          return { ok: false, error: result.error ?? "Nepodařilo se zapsat trénink." };
        }
        return { ok: true };
      }
      repositories.training.create(fields);
      return { ok: true };
    },
    [repositories, useSupabase],
  );

  const persistNutritionFromParsed = useCallback(
    async (data: ParsedData): Promise<{ ok: true } | { ok: false; error: string }> => {
      const nutritionPayload: Omit<NutritionEntry, "id"> = {
        userId: "u1",
        date: String(data.date ?? new Date().toISOString().slice(0, 10)),
        calories: parseLocaleNumber(data.calories),
        protein: parseLocaleNumber(data.protein),
        carbs: parseLocaleNumber(data.carbs),
        fat: parseLocaleNumber(data.fat),
        fiber: parseLocaleNumber(data.fiber),
        waterLiters: parseLocaleNumber(data.waterLiters),
        bodyWeightKg: parseLocaleNumber(data.bodyWeightKg),
        notes: String(data.notes ?? "Vytvořeno z importu screenshotu"),
      };
      if (useSupabase) {
        const response = await fetch("/api/nutrition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nutritionPayload),
        });
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          return { ok: false, error: result.error ?? "Nepodařilo se zapsat výživu." };
        }
        return { ok: true };
      }
      repositories.nutrition.create({
        date: nutritionPayload.date,
        calories: nutritionPayload.calories,
        protein: nutritionPayload.protein,
        carbs: nutritionPayload.carbs,
        fat: nutritionPayload.fat,
        fiber: nutritionPayload.fiber,
        waterLiters: nutritionPayload.waterLiters,
        bodyWeightKg: nutritionPayload.bodyWeightKg,
        notes: nutritionPayload.notes,
      });
      return { ok: true };
    },
    [repositories, useSupabase],
  );

  const onSaveImport = async () => {
    setErrorMessage(null);
    setMessage(null);
    const response = await fetch("/api/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "u1",
        sourceApp,
        imageName: imageName || "manual-entry.png",
        importTarget,
        parsedJson: parsedData,
        status: "saved",
      }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setErrorMessage(result.error ?? "Nepodařilo se uložit import.");
      return;
    }
    const result = (await response.json()) as { importRecord: ImportRecord };
    setSavedImports((prev) => [result.importRecord, ...prev]);

    if (importTarget === "training") {
      const t = await persistTrainingFromParsed(parsedData);
      if (!t.ok) {
        setMessage("Import uložen.");
        setErrorMessage(
          `Trénink se nepodařilo zapsat do deníku: ${t.error} (zkus znovu tlačítkem „Vytvořit trénink z importu“).`,
        );
        return;
      }
      setMessage("Import uložen a trénink je zapsaný v záložce Trénink.");
      return;
    }

    const n = await persistNutritionFromParsed(parsedData);
    if (!n.ok) {
      setMessage("Import uložen.");
      setErrorMessage(`Výživa se nepodařila zapsat do deníku: ${n.error}`);
      return;
    }
    setMessage("Import uložen a výživa je zapsaná v záložce Výživa.");
  };

  const onConvert = async () => {
    setErrorMessage(null);
    setMessage(null);
    if (importTarget === "training") {
      const t = await persistTrainingFromParsed(parsedData);
      if (!t.ok) {
        setErrorMessage(t.error);
        return;
      }
      setMessage("Trénink vytvořen z importu.");
      return;
    }

    const n = await persistNutritionFromParsed(parsedData);
    if (!n.ok) {
      setErrorMessage(n.error);
      return;
    }
    setMessage("Výživa vytvořena z importu.");
  };

  /** Jedním klikem z uloženého importu (starší záznamy bez auto-zápisu do deníku). */
  const onWriteTrainingFromSavedImport = async (item: ImportRecord) => {
    if (item.import_target !== "training") return;
    setErrorMessage(null);
    setMessage(null);
    setWritingTrainingFromImportId(item.id);
    const data = item.parsed_json as ParsedData;
    const t = await persistTrainingFromParsed(data);
    setWritingTrainingFromImportId(null);
    if (!t.ok) {
      setErrorMessage(t.error);
      return;
    }
    setMessage(`Trénink zapsán do deníku (podle importu „${item.image_name}“).`);
  };

  const onWriteNutritionFromSavedImport = async (item: ImportRecord) => {
    if (item.import_target !== "nutrition") return;
    setErrorMessage(null);
    setMessage(null);
    const n = await persistNutritionFromParsed(item.parsed_json as ParsedData);
    if (!n.ok) {
      setErrorMessage(n.error);
      return;
    }
    setMessage(`Výživa zapsána do deníku (podle importu „${item.image_name}“).`);
  };

  const onDeleteImport = async (id: string) => {
    if (!confirm("Opravdu chceš tento import smazat?")) return;
    setDeletingImportId(id);
    setErrorMessage(null);
    setMessage(null);

    const response = await fetch(`/api/imports?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setErrorMessage(result.error ?? "Nepodařilo se smazat import.");
      setDeletingImportId(null);
      return;
    }
    setSavedImports((prev) => prev.filter((item) => item.id !== id));
    setMessage("Import smazán.");
    setDeletingImportId(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="text-base font-semibold">Import screenshotu</h3>
        <p className="text-xs text-zinc-500">
          Vhodné pro fitness screenshoty nebo snímek kalorické tabulky. Na počítači můžeš vložit ze schránky
          (Ctrl+V / Cmd+V). Na iPhonu použij tlačítko „Vybrat fotku“ (Safari někdy nevyplní typ souboru — to je
          opravené), nebo zkopíruj obrázek v Fotkách a vlož ho dlouhým stiskem do stránky.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-600">Zdroj screenshotu</span>
            <select value={sourceApp} onChange={(e) => setSourceApp(e.target.value)} className="rounded-md border border-zinc-300 px-3 py-2">
              <option value="apple-fitness">Apple Fitness / Kondice</option>
              <option value="calorie-table">Kalorické tabulky</option>
              <option value="other">Jiný zdroj</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-600">Cíl importu</span>
            <select
              value={importTarget}
              onChange={(e) => {
                const nextTarget = e.target.value as ImportTarget;
                workoutTypeTouchedRef.current = false;
                setImportTarget(nextTarget);
                setParsedData(nextTarget === "training" ? trainingTemplate : nutritionTemplate);
              }}
              className="rounded-md border border-zinc-300 px-3 py-2"
            >
              <option value="training">Trénink</option>
              <option value="nutrition">Výživa</option>
            </select>
          </label>
          <div className="grid gap-1 text-sm">
            <span className="text-zinc-400">Soubor</span>
            <input
              ref={screenshotFileInputRef}
              id="imports-screenshot-file"
              type="file"
              accept="image/*,.heic,.heif"
              className="sr-only"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
            <label
              htmlFor="imports-screenshot-file"
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-ew-border bg-ew-bg px-4 py-2 text-center text-sm font-medium text-zinc-200 hover:border-ew-blue-light"
            >
              Vybrat fotku / screenshot
            </label>
            {imageName ? (
              <span className="truncate text-xs text-zinc-500" title={imageName}>
                {imageName}
              </span>
            ) : null}
          </div>
        </div>
        {previewUrl && (
          <div className="mt-3">
            <p className="mb-1 text-xs text-zinc-600">Náhled: {imageName}</p>
            <Image
              src={previewUrl}
              alt="Náhled screenshotu"
              width={480}
              height={320}
              unoptimized
              className="max-h-48 w-auto rounded-lg border border-ew-border"
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="mb-2 text-base font-semibold">Parser-ready hodnoty (ruční editace)</h3>
        {importTarget === "training" && (
          <p className="mb-3 text-xs text-zinc-500">
            Po uložení importu se stejný záznam automaticky zapíše i do záložky Trénink. Tlačítkem „Vytvořit trénink z
            importu“ můžeš zapsat další řádek z aktuálních hodnot bez nového ukládání importu.
          </p>
        )}
        {importTarget === "nutrition" && sourceApp === "calorie-table" && (
          <p className="mb-3 text-xs text-zinc-500">
            Lokální OCR (Tesseract) nevidí obraz jako chatové AI — jen hledá text v pixelech. Před zpracováním zvětšíme snímek a
            doplníme makra z pořadí čísel s „g“, když se názvy nepřečtou. Kalorie z kcal; vodu z „… l“ jako zálohu. Vždy
            zkontroluj čísla.
          </p>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {parsedEntries.map(([key, value]) => (
            <label key={key} className="grid gap-1 text-sm">
              <span className="text-zinc-600">
                {importTarget === "nutrition" ? (NUTRITION_LABELS_CS[key] ?? key) : key}
              </span>
              {key === "workoutType" ? (
                <select
                  value={coerceSportType(value)}
                  onChange={(e) => onParsedValueChange(key, e.target.value)}
                  className="rounded-md border border-zinc-300 px-3 py-2"
                >
                  {SPORT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : key === "effort" ? (
                <select
                  value={String(value)}
                  onChange={(e) => onParsedValueChange(key, e.target.value)}
                  className="rounded-md border border-zinc-300 px-3 py-2"
                >
                  <option value="lehké">lehké</option>
                  <option value="střední">střední</option>
                  <option value="vysoké">vysoké</option>
                </select>
              ) : (
                <input
                  value={String(value)}
                  onChange={(e) => onParsedValueChange(key, e.target.value)}
                  className="rounded-md border border-zinc-300 px-3 py-2"
                  inputMode={key === "waterLiters" || key === "bodyWeightKg" ? "decimal" : undefined}
                  step={key === "waterLiters" || key === "bodyWeightKg" ? "0.1" : undefined}
                  min={key === "waterLiters" || key === "bodyWeightKg" ? "0" : undefined}
                />
              )}
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => void onSaveImport()} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">
            Uložit import
          </button>
          <button onClick={() => void onConvert()} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
            Vytvořit {importTarget === "training" ? "trénink" : "výživu"} z importu
          </button>
        </div>
        {isParsing && <p className="mt-2 text-sm text-zinc-600">Načítám text ze screenshotu (OCR)...</p>}
        {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
        {errorMessage && <p className="mt-2 text-sm text-rose-700">{errorMessage}</p>}
      </div>

      <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="mb-2 text-base font-semibold">Poslední importy</h3>
        <p className="mb-3 text-xs text-zinc-500">
          U importů můžeš jedním klikem doplnit záznam do deníku (Trénink nebo Výživa). Použijí se uložená pole z daného importu.
        </p>
        <div className="space-y-2 text-sm">
          {savedImports.slice(0, 30).map((item) => {
            const pj = item.parsed_json ?? {};
            const coerced =
              item.import_target === "training" ? coerceSportType(pj.workoutType) : null;
            const rawSport = String(pj.workoutType ?? "").trim() || "—";
            return (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-zinc-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium">
                      {item.created_at?.slice(0, 10)} · {item.source_app} · {item.import_target}
                    </p>
                    <p className="break-all text-xs text-zinc-600">{item.image_name}</p>
                    {item.import_target === "training" && (
                      <p className="mt-1 text-xs text-zinc-700">
                        Sport ve formě: <span className="font-medium">{rawSport}</span> → do deníku:{" "}
                        <span className="font-medium text-ew-blue-light">{coerced}</span>
                        {" · "}
                        {String(pj.durationMin ?? "—")} min · {String(pj.calories ?? "—")} kcal
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenImportDetailId((id) => (id === item.id ? null : item.id))}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-100"
                    >
                      {openImportDetailId === item.id ? "Skrýt" : "Detail"}
                    </button>
                    {item.import_target === "training" && (
                      <button
                        type="button"
                        onClick={() => void onWriteTrainingFromSavedImport(item)}
                        disabled={writingTrainingFromImportId === item.id}
                        className="rounded border border-ew-border bg-ew-bg px-2 py-1 text-xs text-ew-blue-light hover:border-ew-blue-light disabled:opacity-50"
                      >
                        {writingTrainingFromImportId === item.id ? "Zapisuji…" : "Zapsat do deníku"}
                      </button>
                    )}
                    {item.import_target === "nutrition" && (
                      <button
                        type="button"
                        onClick={() => void onWriteNutritionFromSavedImport(item)}
                        className="rounded border border-ew-border bg-ew-bg px-2 py-1 text-xs text-ew-blue-light hover:border-ew-blue-light"
                      >
                        Zapsat do výživy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void onDeleteImport(item.id)}
                      className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                      disabled={deletingImportId === item.id}
                    >
                      {deletingImportId === item.id ? "Mažu..." : "Smazat"}
                    </button>
                  </div>
                </div>
                {openImportDetailId === item.id && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded border border-zinc-200 bg-white p-2 text-left text-[11px] leading-snug text-zinc-800">
                    {JSON.stringify(pj, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function parseTextToFields(text: string, target: ImportTarget): ParsedData {
  const normalized = text.replace(/,/g, ".").toLowerCase();
  if (target === "training") {
    const workoutType = inferWorkoutType(normalized);
    const calories =
      extractNumber(normalized, /(\d+(?:\.\d+)?)\s*(kcal|calories)/) ??
      extractNumber(normalized, /active\s*calories\D+(\d+(?:\.\d+)?)/) ??
      0;
    const distanceKm = extractDistanceKm(normalized, workoutType);
    const avgHeartRate =
      extractNumber(normalized, /(avg|average)\s*heart\D+(\d+(?:\.\d+)?)/, 2) ??
      extractNumber(normalized, /(\d+(?:\.\d+)?)\s*bpm/) ??
      0;
    const durationMin = extractDurationMinutes(normalized) ?? 0;
    return {
      date: new Date().toISOString().slice(0, 10),
      workoutType,
      durationMin: Math.round(durationMin),
      distanceKm,
      calories: Math.round(calories),
      averageHeartRate: Math.round(avgHeartRate),
      pace: extractPace(normalized) ?? "-",
      elevation: extractNumber(normalized, /elevation\D+(\d+(?:\.\d+)?)/) ?? 0,
      effort: inferEffort(normalized),
      notes: "Auto parser ze screenshotu",
    };
  }

  return parseNutritionFromScreenshot(text);
}

/**
 * Kalorické tabulky:
 * - „Přehled“: velké kruhy — často je **číslo v gramech nad popiskem** (OCR: „133 g … bílkoviny“).
 * - „Nutrienty“: typicky první „… g“ **za** názvem živiny.
 * `gramsNearLabel` zkouší nejdřív hodnotu za štítkem, pak těsně před ním (nad ním v buňce).
 */
function parseNutritionFromScreenshot(raw: string): ParsedData {
  const n = normalizeNutritionOcr(raw);
  const dateIso = extractNutritionDate(n) ?? new Date().toISOString().slice(0, 10);

  const caloriesRaw = extractKalorickeKalorie(n);
  let protein =
    gramsNearLabel(n, "b[ií]lkoviny[a-zá-ž]*") ??
    gramsNearLabel(n, "b[ií]lkovin[a-zá-ž]*") ??
    gramsNearLabel(n, "b[ií]lkovin");
  let carbs =
    gramsNearLabel(n, "sacharidy[a-zá-ž]*") ??
    gramsNearLabel(n, "sacharid[a-zá-ž]*") ??
    gramsNearLabel(n, "sacharid") ??
    gramsNearLabel(n, "uhlohydr[a-zá-ž]*");
  let fat =
    gramsNearLabel(n, "tuky[a-zá-ž]*") ??
    gramsNearLabel(n, "tuku[a-zá-ž]*") ??
    gramsNearLabel(n, "\\btuk[a-zá-ž]{1,4}\\b");
  let fiber =
    gramsNearLabel(n, "vl[aá]knina[a-zá-ž]*") ??
    gramsNearLabel(n, "vl[aá]knin[a-zá-ž]*") ??
    gramsNearLabel(n, "vlaknin[a-zá-ž]*");

  const seq = extractKtMacroRowFromGramSequence(n, protein != null && protein > 0 ? protein : null);
  if (seq) {
    if (protein == null || protein === 0) protein = seq.protein;
    if (carbs == null || carbs === 0) carbs = seq.carbs;
    if (fat == null || fat === 0) fat = seq.fat;
    if (fiber == null || fiber === 0) fiber = seq.fiber;
  }

  const waterLiters = extractWaterLitersKt(n);
  const bodyWeightKg = extractBodyWeightKg(n);

  const notesHint =
    /nutrienty|nutrient/i.test(raw) && (caloriesRaw === null || caloriesRaw === 0)
      ? "Auto parser (Nutrienty — kalorie často chybí, doplň z Přehledu nebo ručně)."
      : "Auto parser ze screenshotu Kalorických tabulek";

  return {
    date: dateIso,
    calories: caloriesRaw ?? 0,
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0,
    fiber: fiber ?? 0,
    waterLiters: waterLiters !== null ? waterLiters : "",
    bodyWeightKg: bodyWeightKg === null ? "" : bodyWeightKg,
    notes: notesHint,
  };
}

/** Mezery v tisících (1 042), desetinná čárka u jednotek (53,9 g). */
function normalizeNutritionOcr(raw: string): string {
  let t = raw.toLowerCase();
  t = t.replace(/\r\n/g, "\n");
  let prev = "";
  while (prev !== t) {
    prev = t;
    t = t.replace(/(\d)\s+(\d{3})\b/g, "$1$2");
  }
  t = t.replace(/(\d+),(\d+)\s*(g|mg)\b/g, "$1.$2 $3");
  t = t.replace(/(\d+),(\d+)\s*kg\b/g, "$1.$2 kg");
  t = t.replace(/(\d+),(\d+)\s*l\b/g, "$1.$2 l");
  return t;
}

/**
 * Hodnota v gramech u štítku:
 * 1) Krátce za názvem (typicky Nutrienty: „bílkoviny 133 g“).
 * 2) Těsně před názvem — poslední „… g“ v úseku ~96 znaků (Přehled: velké číslo nad popiskem).
 * 3) Dál za názvem / širší před názvem jako záloha.
 */
function gramsNearLabel(text: string, labelSource: string): number | null {
  const re = new RegExp(labelSource, "iy");
  const m = re.exec(text);
  if (!m || m.index === undefined) return null;
  const labelStart = m.index;
  const labelEnd = m.index + m[0].length;

  const afterShort = text.slice(labelEnd, labelEnd + 100);
  const afterShortGm = afterShort.match(/(\d{1,4}(?:\.\d+)?)\s*g\b/);
  if (afterShortGm) {
    const v = parseFloat(afterShortGm[1]);
    if (!Number.isNaN(v) && v >= 0 && v <= 9999) return Math.round(v);
  }

  const tightBefore = text.slice(Math.max(0, labelStart - 96), labelStart);
  const tightAll = [...tightBefore.matchAll(/(\d{1,4}(?:\.\d+)?)\s*g\b/gi)];
  if (tightAll.length > 0) {
    const lastT = tightAll[tightAll.length - 1];
    const v = parseFloat(lastT[1]);
    if (!Number.isNaN(v) && v >= 0 && v <= 9999) return Math.round(v);
  }

  const afterLong = text.slice(labelEnd, labelEnd + 420);
  const afterLongGm = afterLong.match(/(\d{1,4}(?:\.\d+)?)\s*g\b/);
  if (afterLongGm) {
    const v = parseFloat(afterLongGm[1]);
    if (!Number.isNaN(v) && v >= 0 && v <= 9999) return Math.round(v);
  }

  const wideBefore = text.slice(Math.max(0, labelStart - 280), labelStart);
  const wideFirst = wideBefore.match(/(\d{1,4}(?:\.\d+)?)\s*g\b/);
  if (wideFirst) {
    const v = parseFloat(wideFirst[1]);
    if (!Number.isNaN(v) && v >= 0 && v <= 9999) return Math.round(v);
  }

  return null;
}

/**
 * Záloha: když štítky v textu chybí, vezmeme čtyři po sobě jdoucí hodnoty „… g“ (řádek Přehledu).
 * Pokud známe bílkoviny z části textu, zarovnáme začátek řady na ně.
 */
function extractKtMacroRowFromGramSequence(
  text: string,
  anchorProtein: number | null,
): { protein: number; carbs: number; fat: number; fiber: number } | null {
  const nums = [...text.matchAll(/(\d{1,4}(?:\.\d+)?)\s*g\b/gi)]
    .map((m) => Math.round(parseFloat(m[1])))
    .filter((v) => v >= 1 && v <= 600);

  if (nums.length < 4) return null;

  let start = 0;
  if (anchorProtein != null && anchorProtein > 0) {
    const idx = nums.findIndex((x) => Math.abs(x - anchorProtein) <= 2);
    if (idx >= 0) start = idx;
  }

  for (let i = start; i + 3 < nums.length; i++) {
    const a = nums[i];
    const b = nums[i + 1];
    const c = nums[i + 2];
    const d = nums[i + 3];
    if (a < 8 || b < 8 || c < 5) continue;
    if (a > 380 || b > 500 || c > 280) continue;
    if (d > 120) continue;
    return { protein: a, carbs: b, fat: c, fiber: d };
  }

  if (anchorProtein == null || anchorProtein <= 0) {
    for (let i = 0; i + 3 < nums.length; i++) {
      const a = nums[i];
      const b = nums[i + 1];
      const c = nums[i + 2];
      const d = nums[i + 3];
      if (a >= 15 && a <= 350 && b >= 15 && b <= 500 && c >= 8 && c <= 250 && d >= 0 && d <= 100) {
        return { protein: a, carbs: b, fat: c, fiber: d };
      }
    }
  }

  return null;
}

/** Pitný režim v litrech (Přehled i Nutrienty). */
function extractWaterLitersKt(text: string): number | null {
  const patterns: RegExp[] = [
    /pitný\s+režim\D{0,45}(\d+[.,]?\d*)\s*l\b/i,
    /pitni\s+rezim\D{0,45}(\d+[.,]?\d*)\s*l\b/i,
    /pitn[a-zá-ž]*\s+re[zž][a-zá-ž]*\D{0,45}(\d+[.,]?\d*)\s*l\b/i,
    /pitn[a-zá-ž]*\D{0,45}(\d+[.,]?\d*)\s*l\b/i,
    /(?:voda|pitný)\D{0,40}(\d+[.,]?\d*)\s*l\b/i,
    /(\d+[.,]?\d*)\s*l\D{0,30}pitn/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    const raw = m?.[1];
    if (!raw) continue;
    const v = parseFloat(raw.replace(",", "."));
    if (!Number.isNaN(v) && v >= 0 && v <= 25) return Math.round(v * 10) / 10;
  }
  const loose = [...text.matchAll(/\b(\d+[.,]\d+)\s*l\b/gi)];
  for (let i = loose.length - 1; i >= 0; i--) {
    const raw = loose[i]?.[1];
    if (!raw) continue;
    const v = parseFloat(raw.replace(",", "."));
    if (!Number.isNaN(v) && v >= 0.3 && v <= 12) return Math.round(v * 10) / 10;
  }
  return null;
}

/** Kalorie: „Přehled“ — horní kruh (např. 1 954 kcal po normalizaci 1954 kcal). */
function extractKalorickeKalorie(text: string): number | null {
  const byKcal =
    extractNumber(text, /\b(\d{3,5})\s*k\s*cal\b/) ??
    extractNumber(text, /\b(\d{3,5})\s*kcal\b/) ??
    extractNumber(text, /\b(\d{3,5})\s*cal\b/);
  if (byKcal !== null && byKcal >= 100 && byKcal <= 15000) return Math.round(byKcal);

  const afterLabel = extractNumber(text, /(?:kalori[ei]|energie)\D{0,55}(\d{3,5})\b/);
  if (afterLabel !== null && afterLabel >= 100 && afterLabel <= 15000) return Math.round(afterLabel);

  const beforeKcal = extractNumber(text, /\b(\d{3,5})\D{0,20}kcal/i);
  if (beforeKcal !== null && beforeKcal >= 100 && beforeKcal <= 15000) return Math.round(beforeKcal);

  const spaced = text.match(/\b(\d)\s+(\d{3})\s*kcal\b/i);
  if (spaced?.[1] && spaced[2]) {
    const merged = Number(`${spaced[1]}${spaced[2]}`);
    if (!Number.isNaN(merged) && merged >= 100 && merged <= 15000) return merged;
  }

  return null;
}

/** dd.mm.yyyy nebo d. m. yyyy v textu */
function extractNutritionDate(text: string): string | null {
  const m =
    text.match(/\b(\d{1,2})\s*[./]\s*(\d{1,2})\s*[./]\s*(\d{2,4})\b/) ??
    text.match(/\b(\d{4})\s*[-]\s*(\d{2})\s*[-]\s*(\d{2})\b/);
  if (!m) return null;
  if (m[0].includes("-") && m.length >= 4) {
    const y = m[1];
    const mo = m[2];
    const d = m[3];
    return `${y}-${mo}-${d}`;
  }
  const d = Number(m[1]);
  const month = Number(m[2]);
  const yRaw = Number(m[3]);
  const y = yRaw < 100 ? 2000 + yRaw : yRaw;
  if (d < 1 || d > 31 || month < 1 || month > 12) return null;
  const mm = String(month).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function extractBodyWeightKg(text: string): number | null {
  const labeled =
    extractNumber(text, /(?:v[aá]ha|hmotnost|weight)\D{0,20}(\d{2,3}(?:\.\d)?)\s*(?:kg|kil)/i) ??
    extractNumber(text, /(\d{2,3}(?:\.\d)?)\s*kg\D{0,15}(?:v[aá]ha|body|hmot)/i);
  if (labeled !== null && labeled >= 35 && labeled <= 250) return labeled;
  return null;
}

function extractNumber(input: string, regex: RegExp, group = 1): number | null {
  const match = input.match(regex);
  if (!match) return null;
  const raw = match[group];
  if (!raw) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

function extractDurationMinutes(input: string): number | null {
  // 1) Prefer explicit "min" values.
  const minMatch = input.match(/(\d{1,3}(?:\.\d+)?)\s*min(?:ut[ay]?)?/);
  if (minMatch) {
    const minutes = Number(minMatch[1]);
    if (!Number.isNaN(minutes) && minutes > 0 && minutes <= 360) return minutes;
  }

  // 2) Accept "duration/trvání/time" labels with hh:mm or hh:mm:ss.
  const labeled = input.match(
    /(duration|trv[aá]n[ií]|d[eé]lka|workout time|čas)\D{0,20}(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );
  if (labeled) {
    const hOrM = Number(labeled[2]);
    const mOrS = Number(labeled[3]);
    const sec = labeled[4] ? Number(labeled[4]) : 0;
    if (!Number.isNaN(hOrM) && !Number.isNaN(mOrS)) {
      // If 3-part time exists, treat as hh:mm:ss. If not, treat as mm:ss.
      if (labeled[4]) {
        const total = hOrM * 60 + mOrS + Math.round(sec / 60);
        if (total > 0 && total <= 360) return total;
      }
      const total = hOrM + Math.round(mOrS / 60);
      if (total > 0 && total <= 360) return total;
    }
  }

  // 3) Last resort for standalone hh:mm:ss likely to be workout duration.
  const hhmmss = input.match(/\b(\d{1,2}):(\d{2}):(\d{2})\b/);
  if (hhmmss) {
    const h = Number(hhmmss[1]);
    const m = Number(hhmmss[2]);
    const s = Number(hhmmss[3]);
    const total = h * 60 + m + Math.round(s / 60);
    if (!Number.isNaN(total) && total > 0 && total <= 360) return total;
  }

  // 4) Avoid parsing pace values like 8:02/km as duration.
  return null;
}

function extractPace(input: string): string | null {
  const match = input.match(/(\d{1,2}[:.]\d{2})\s*\/\s*(km|mi)/);
  if (!match) return null;
  return `${match[1].replace(".", ":")}/${match[2]}`;
}

function inferWorkoutType(input: string): TrainingSession["sportType"] {
  const n = input.toLowerCase();
  if (/(cross\s*training|crosstraining|cross-training|crossfit)/.test(n)) return "CrossFit";
  if (/(nordic\s*walk|seversk)/.test(n)) return "Nordic walking";
  if (/(walk|ch[uů]ze|walking|proch[aá]zka)/.test(n)) return "Walking";
  if (/(run|b[eě]h|jog)/.test(n)) return "Walking";
  if (/(cycle|bike|cyklo|cyklist|kolo|j[ií]zda)/.test(n)) return "Cycling";
  if (/(scooter|kolob[eě][zž]k)/.test(n)) return "Scooter";
  if (/(ski|ly[zž])/.test(n)) return "Skiing";
  return coerceSportType(input);
}

function extractDistanceKm(
  input: string,
  workoutType: TrainingSession["sportType"],
): number {
  // For CrossFit / Bodybuilding, distance is typically irrelevant unless explicitly labeled.
  if (workoutType === "CrossFit" || workoutType === "Bodybuilding") {
    const explicit = input.match(
      /(distance|vzd[aá]lenost)\D{0,12}(\d+(?:\.\d+)?)\s*(km|kilometers?)/,
    );
    if (!explicit?.[2]) return 0;
    const explicitValue = Number(explicit[2]);
    return Number.isNaN(explicitValue) ? 0 : explicitValue;
  }

  const labeled = input.match(
    /(distance|vzd[aá]lenost)\D{0,12}(\d+(?:\.\d+)?)\s*(km|kilometers?)/,
  );
  if (labeled?.[2]) {
    const value = Number(labeled[2]);
    return Number.isNaN(value) ? 0 : value;
  }

  const generic = input.match(/\b(\d+(?:\.\d+)?)\s*(km|kilometers?)\b/);
  if (generic?.[1]) {
    const value = Number(generic[1]);
    if (!Number.isNaN(value) && value >= 0.1 && value <= 300) return value;
  }
  return 0;
}

function inferEffort(input: string): string {
  if (/(high|intense|vysok[ée]|hard)/.test(input)) return "vysoké";
  if (/(light|easy|low|leh[kc][ée])/ .test(input)) return "lehké";
  return "střední";
}
