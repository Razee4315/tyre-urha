import { THEMES, type Theme } from "../lib/themes";
import type { Settings, ThemeId } from "../lib/types";

type Props = {
  settings: Settings;
  onChange: (next: Settings) => void;
  onBack: () => void;
};

const themeArtBg = (t: Theme): string => `#${(t.sky & 0xffffff).toString(16).padStart(6, "0")}`;
const themeArtGround = (t: Theme): string => `#${(t.ground & 0xffffff).toString(16).padStart(6, "0")}`;
const themeArtTower = (t: Theme): string => `#${(t.tower & 0xffffff).toString(16).padStart(6, "0")}`;

export function Themes({ settings, onChange, onBack }: Props) {
  const select = (id: ThemeId) => onChange({ ...settings, themeId: id });

  return (
    <div className="screen panel">
      <div className="screen-bg" />

      <div className="panel-header">
        <button className="btn btn-icon" onClick={onBack} aria-label="Back">←</button>
        <h2>Themes</h2>
      </div>

      <div className="panel-body">
        <div className="themes-grid">
          {(Object.values(THEMES) as Theme[]).map((t) => {
            const active = settings.themeId === t.id;
            const style = {
              ["--art-bg" as never]: themeArtBg(t),
              ["--art-ground" as never]: themeArtGround(t),
              ["--art-tower" as never]: themeArtTower(t),
            } as React.CSSProperties;
            return (
              <button
                key={t.id}
                className={`theme-card ${active ? "active" : ""}`}
                onClick={() => select(t.id)}
                aria-pressed={active}
              >
                <div className="theme-card-art" style={style} />
                <div className="theme-card-tower" style={style} />
                <div className="theme-card-name">{t.label}</div>
                {active ? <div className="theme-card-check">✓</div> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
