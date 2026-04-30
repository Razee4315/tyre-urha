import type { Settings, Stats } from "./types";

const SETTINGS_KEY = "tyre-launch.settings.v1";
const STATS_KEY = "tyre-launch.stats.v1";

const defaultSettings: Settings = {
  themeId: "desert",
  difficulty: "normal",
  sfxOn: true,
  hapticsOn: true,
};

const defaultStats: Stats = {
  bestSpeed: 0,
  totalHits: 0,
  totalLaunches: 0,
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed } as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable; ignore */
  }
}

export function loadSettings(): Settings {
  return safeRead(SETTINGS_KEY, defaultSettings);
}

export function saveSettings(settings: Settings): void {
  safeWrite(SETTINGS_KEY, settings);
}

export function loadStats(): Stats {
  return safeRead(STATS_KEY, defaultStats);
}

export function saveStats(stats: Stats): void {
  safeWrite(STATS_KEY, stats);
}
