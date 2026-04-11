"use client";

import { useMemo } from "react";
import { YOUTUBE_LEARNING_SOURCES } from "@/lib/learning/youtube-sources";

export function SourceBadge({ source, variant = "light" }: { source: string; variant?: "light" | "dark" }) {
  if (variant === "dark") {
    const color =
      source === "crossfit"
        ? "bg-emerald-950/80 text-emerald-200 ring-1 ring-emerald-800/80"
        : source === "wodwell"
          ? "bg-blue-950/80 text-blue-200 ring-1 ring-blue-800/80"
          : source === "youtube-inspired"
            ? "bg-amber-950/80 text-amber-200 ring-1 ring-amber-800/80"
            : "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-600";
    return <span className={`rounded-full px-2 py-1 text-xs font-medium ${color}`}>{source}</span>;
  }
  const color =
    source === "crossfit"
      ? "bg-emerald-100 text-emerald-800"
      : source === "wodwell"
        ? "bg-blue-100 text-blue-800"
        : source === "youtube-inspired"
          ? "bg-amber-100 text-amber-800"
          : "bg-zinc-100 text-zinc-700";
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${color}`}>{source}</span>;
}

export function SourceFilterTabs() {
  const tabs = ["vše", "crossfit", "wodwell", "youtube-inspired", "custom"];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button key={tab} className="rounded-full border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100">
          {tab}
        </button>
      ))}
    </div>
  );
}

export function VideoEmbedCard({ title, url, source }: { title: string; url: string; source: string }) {
  return (
    <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-white">{title}</h3>
        <SourceBadge source={source} variant="dark" />
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-ew-blue hover:underline">
        Otevřít na YouTube
      </a>
    </div>
  );
}

/** Kompaktní náhled (např. na detailu benchmarku) — první čtyři zdroje. */
export function LearningPriorityPreview() {
  const preview = useMemo(() => YOUTUBE_LEARNING_SOURCES.slice(0, 4), []);
  return (
    <div className="space-y-3">
      {preview.map((item) => (
        <VideoEmbedCard key={item.id} title={item.label} url={item.url} source={item.sourceType} />
      ))}
    </div>
  );
}

/** Plný seznam kurátorovaných YouTube zdrojů na stránce /learning. */
export function LearningYoutubeHub() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {YOUTUBE_LEARNING_SOURCES.map((item) => (
        <div
          key={item.id}
          className="flex flex-col rounded-xl border border-ew-border bg-ew-panel p-4 ring-1 ring-white/5"
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {item.kind === "playlist" ? "Playlist" : "Kanál"}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-white">{item.label}</h3>
            </div>
            <SourceBadge source={item.sourceType} variant="dark" />
          </div>
          <p className="mb-4 flex-1 text-sm text-zinc-400">{item.shortDescription}</p>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-sm font-medium text-ew-blue hover:underline"
          >
            Otevřít na YouTube →
          </a>
        </div>
      ))}
    </div>
  );
}
