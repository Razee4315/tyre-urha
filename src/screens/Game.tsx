import { useEffect, useMemo, useRef, useState } from "react";
import { Game as GameEngine } from "../engine";
import { attachLookSurface, createInputState } from "../engine/input";
import { audio } from "../lib/audio";
import type { GameHudState, GameInputState, Settings, Stats } from "../lib/types";
import { Joystick } from "../components/Joystick";
import { HudActions } from "../components/HudActions";

type Props = {
  settings: Settings;
  onPause: () => void;
  onWin: (releaseSpeed: number, hud: Stats) => void;
  stats: Stats;
  /** When true, the game loop is paused but the canvas + scene stay alive. */
  paused?: boolean;
};

export function Game({ settings, onPause, onWin, stats, paused = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<GameInputState>(createInputState());
  const engineRef = useRef<GameEngine | null>(null);
  const [hud, setHud] = useState<GameHudState>({
    charge: 0,
    status: "Walk to the tyre and tap Pick",
    canRelease: false,
    actionLabel: "Pick",
    canAction: false,
    lastReleaseSpeed: 0,
    hit: false,
  });
  const [toast, setToast] = useState<string | null>(null);

  // Keep stats in a ref so the win callback always sees the latest values
  // without forcing a remount of the engine.
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    void audio.unlock();

    const engine = new GameEngine(
      container,
      inputRef.current,
      { ...settingsRef.current },
      {
        onHud: setHud,
        onWin: (speed) => {
          const s = statsRef.current;
          const next: Stats = {
            bestSpeed: Math.max(s.bestSpeed, speed),
            totalHits: s.totalHits + 1,
            totalLaunches: s.totalLaunches + 1,
          };
          onWin(speed, next);
          setToast(`Direct hit · ${speed.toFixed(1)} m/s`);
          window.setTimeout(() => setToast(null), 1700);
        },
      },
    );
    engineRef.current = engine;
    engine.start();

    const detachLook = attachLookSurface(container, inputRef.current, ".joystick, .actions, .hud-top, .hud-meter");

    return () => {
      detachLook();
      engine.dispose();
      engineRef.current = null;
    };
    // We intentionally only mount once; settings changes are pushed via an
    // effect below to avoid a full scene tear-down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setSfxOn(settings.sfxOn);
  }, [settings.sfxOn]);

  useEffect(() => {
    if (!engineRef.current) return;
    if (paused) engineRef.current.pause();
    else engineRef.current.resume();
  }, [paused]);

  // Pause when the user switches tabs / app goes background
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden") {
        engineRef.current?.pause();
        onPause();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [onPause]);

  const meterPercent = useMemo(() => Math.round(hud.charge * 100), [hud.charge]);

  return (
    <div className="screen-game" style={{ position: "absolute", inset: 0 }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      <div className="hud" aria-live="polite">
        <div className="hud-top">
          <div className="hud-status">
            <span className="eyebrow">Status</span>
            <span>{hud.status}</span>
          </div>
          <button
            className="hud-pause"
            type="button"
            aria-label="Pause"
            onPointerDown={(e) => {
              e.preventDefault();
              engineRef.current?.pause();
              onPause();
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        </div>

        <div className="hud-meter">
          <div className="label">
            <span>Roller charge</span>
            <span>{meterPercent}%</span>
          </div>
          <div className="bar">
            <div className="fill" style={{ width: `${meterPercent}%` }} />
          </div>
        </div>

        {toast ? <div className="toast">{toast}</div> : null}

        <Joystick input={inputRef.current} />
        <HudActions hud={hud} input={inputRef.current} />
      </div>
    </div>
  );
}
