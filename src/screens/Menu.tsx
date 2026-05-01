import { Logo } from "../components/Logo";
import templateConfig from "../../template.config.json";
import type { Settings, Stats, ThemeId } from "../lib/types";

type Props = {
  settings: Settings;
  stats: Stats;
  onPlay: () => void;
  onThemes: () => void;
  onSettings: () => void;
};

const themeBgClass = (id: ThemeId): string => {
  switch (id) {
    case "night":
      return "night";
    case "snow":
      return "snow";
    case "sunset":
      return "sunset";
    default:
      return "";
  }
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="m-stat">
      <span className="m-stat-label">{label}</span>
      <strong className="m-stat-value">{value}</strong>
    </div>
  );
}

export function Menu({ settings, stats, onPlay, onThemes, onSettings }: Props) {
  return (
    <div className="screen menu-v2">
      <div className={`screen-bg ${themeBgClass(settings.themeId)}`} />

      <span className="m-version" aria-label={`Version ${templateConfig.version}`}>
        v{templateConfig.version}
      </span>

      <div className="m-content">
        <div className="m-left">
          <div className="m-brand">
            <Logo size={88} />
            <div className="m-brand-text">
              <h1 className="m-title">Tyre Launch</h1>
              <p className="m-tagline">Roll · Charge · Release</p>
            </div>
          </div>

          <div className="m-stats">
            <StatTile label="Best speed" value={`${stats.bestSpeed.toFixed(1)} m/s`} />
            <StatTile label="Hits" value={String(stats.totalHits)} />
            <StatTile label="Launches" value={String(stats.totalLaunches)} />
          </div>
        </div>

        <div className="m-right">
          <button
            type="button"
            className="m-btn m-btn-primary"
            onClick={onPlay}
            aria-label="Play"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 2 L13 8 L3 14 Z" fill="currentColor" />
            </svg>
            Play
          </button>

          <div className="m-secondary">
            <button
              type="button"
              className="m-btn m-btn-ghost"
              onClick={onThemes}
              aria-label="Themes"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="7" r="1.4" fill="currentColor" />
                <circle cx="7" cy="12" r="1.4" fill="currentColor" />
                <circle cx="17" cy="12" r="1.4" fill="currentColor" />
                <circle cx="12" cy="17" r="1.4" fill="currentColor" />
              </svg>
              Themes
            </button>
            <button
              type="button"
              className="m-btn m-btn-ghost"
              onClick={onSettings}
              aria-label="Settings"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
              </svg>
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
