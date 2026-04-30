import { Logo } from "../components/Logo";
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

export function Menu({ settings, stats, onPlay, onThemes, onSettings }: Props) {
  return (
    <div className="screen menu">
      <div className={`screen-bg ${themeBgClass(settings.themeId)}`} />

      <div className="menu-header">
        <Logo size={140} />
        <p className="menu-eyebrow">Powered by Tauri 2 · Three.js</p>
        <h1 className="menu-title">Tyre Launch</h1>
      </div>

      <div className="menu-stats">
        <div className="menu-stat">
          <span>Best speed</span>
          <strong>{stats.bestSpeed.toFixed(1)} m/s</strong>
        </div>
        <div className="menu-stat">
          <span>Hits</span>
          <strong>{stats.totalHits}</strong>
        </div>
        <div className="menu-stat">
          <span>Launches</span>
          <strong>{stats.totalLaunches}</strong>
        </div>
      </div>

      <div className="menu-buttons">
        <button className="btn btn-primary" onClick={onPlay}>
          ▶ Play
        </button>
        <button className="btn btn-ghost" onClick={onThemes}>
          🎨 Themes
        </button>
        <button className="btn btn-ghost" onClick={onSettings}>
          ⚙ Settings
        </button>
      </div>

      <div className="menu-footer">v0.1.0 · Saqlain</div>
    </div>
  );
}
