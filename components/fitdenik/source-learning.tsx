"use client";

import { useMemo } from "react";
import { mediaResources } from "@/lib/mock-data";

export function SourceBadge({ source }: { source: string }) {
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
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <SourceBadge source={source} />
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
        Otevřít video zdroj
      </a>
    </div>
  );
}

export function LearningPriorityPreview() {
  const ranked = useMemo(
    () =>
      [...mediaResources].sort((a, b) => {
        if (a.sourceType === "crossfit" && b.sourceType !== "crossfit") return -1;
        if (a.sourceType !== "crossfit" && b.sourceType === "crossfit") return 1;
        return a.sourcePriority - b.sourcePriority;
      }),
    [],
  );
  return (
    <div className="space-y-3">
      {ranked.map((video) => (
        <VideoEmbedCard key={video.id} title={video.title} url={video.url} source={video.sourceType} />
      ))}
    </div>
  );
}
