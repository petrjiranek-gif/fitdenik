import type { SourceType } from "@/lib/types";

/** Kurátorované YouTube zdroje pro záložku Výuková videa (pořadí = priorita). */
export type YoutubeLearningKind = "playlist" | "channel";

export interface YoutubeLearningSource {
  id: string;
  label: string;
  url: string;
  kind: YoutubeLearningKind;
  /** Pro badge a řazení — CrossFit / WODwell / ostatní inspirace */
  sourceType: SourceType;
  shortDescription: string;
}

export const YOUTUBE_LEARNING_SOURCES: YoutubeLearningSource[] = [
  {
    id: "crossfit-essentials-playlist",
    label: "CrossFit Essentials",
    url: "https://www.youtube.com/playlist?list=PLdWvFCOAvyr3EWQhtfcEMd3DVM5sJdPL4",
    kind: "playlist",
    sourceType: "crossfit",
    shortDescription: "Oficiální playlist CrossFit — základní pohyby a technika.",
  },
  {
    id: "crossfit-channel",
    label: "CrossFit (kanál)",
    url: "https://www.youtube.com/@crossfit/videos",
    kind: "channel",
    sourceType: "crossfit",
    shortDescription: "Hlavní kanál CrossFit na YouTube.",
  },
  {
    id: "wodwell-channel",
    label: "WODwell",
    url: "https://www.youtube.com/@wodwell",
    kind: "channel",
    sourceType: "wodwell",
    shortDescription: "Benchmarky, WOD a technika ve stylu WODwell.",
  },
  {
    id: "fitonomy-coaching",
    label: "Fitonomy Coaching",
    url: "https://www.youtube.com/@fitonomycoaching",
    kind: "channel",
    sourceType: "youtube-inspired",
    shortDescription: "Coaching a tréninkový obsah.",
  },
  {
    id: "workout-body",
    label: "WORKOUT Body",
    url: "https://www.youtube.com/@WORKOUTBody",
    kind: "channel",
    sourceType: "youtube-inspired",
    shortDescription: "Workout a pohybový obsah.",
  },
  {
    id: "calimove",
    label: "Calisthenicmovement (Cali Move)",
    url: "https://www.youtube.com/@calimove",
    kind: "channel",
    sourceType: "youtube-inspired",
    shortDescription: "Kalistenika, síla vlastní vahou a mobilita.",
  },
  {
    id: "topfitness",
    label: "TOP FITNESS",
    url: "https://www.youtube.com/@TOPFITNESS1",
    kind: "channel",
    sourceType: "youtube-inspired",
    shortDescription: "Fitness a tréninková videa.",
  },
  {
    id: "workout-guru",
    label: "Workout Guru",
    url: "https://www.youtube.com/@workout-guru",
    kind: "channel",
    sourceType: "youtube-inspired",
    shortDescription: "Workout tipy a cvičení.",
  },
];
