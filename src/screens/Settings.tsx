import type { Difficulty, Settings as SettingsT } from "../lib/types";

type Props = {
  settings: SettingsT;
  onChange: (next: SettingsT) => void;
  onBack: () => void;
};

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

export function Settings({ settings, onChange, onBack }: Props) {
  const set = <K extends keyof SettingsT>(key: K, value: SettingsT[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="screen panel">
      <div className="screen-bg" />

      <div className="panel-header">
        <button className="btn btn-icon" onClick={onBack} aria-label="Back">←</button>
        <h2>Settings</h2>
      </div>

      <div className="panel-body">
        <div className="row">
          <div className="row-label">
            <div className="row-title">Difficulty</div>
            <div className="row-help">Tunes charge rate and aim assist</div>
          </div>
          <div className="segmented">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={d === settings.difficulty ? "active" : ""}
                onClick={() => set("difficulty", d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <div className="row-label">
            <div className="row-title">Sound effects</div>
            <div className="row-help">Engine rumble, whoosh, thud</div>
          </div>
          <button
            className={`toggle ${settings.sfxOn ? "on" : ""}`}
            onClick={() => set("sfxOn", !settings.sfxOn)}
            aria-pressed={settings.sfxOn}
            aria-label="Toggle sound effects"
          />
        </div>

        <div className="row">
          <div className="row-label">
            <div className="row-title">Haptics</div>
            <div className="row-help">Vibration on actions and hits</div>
          </div>
          <button
            className={`toggle ${settings.hapticsOn ? "on" : ""}`}
            onClick={() => set("hapticsOn", !settings.hapticsOn)}
            aria-pressed={settings.hapticsOn}
            aria-label="Toggle haptics"
          />
        </div>

        <div className="row">
          <div className="row-label">
            <div className="row-title">About</div>
            <div className="row-help">
              A first-person tyre-rolling toy reborn for Android. Built on
              Tauri 2 + Three.js + cannon-es.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
