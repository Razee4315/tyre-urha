import type { GameHudState, GameInputState } from "../lib/types";

type Props = {
  hud: GameHudState;
  input: GameInputState;
};

export function HudActions({ hud, input }: Props) {
  const dashLength = 280; // approx circumference of r=46
  const offset = dashLength * (1 - hud.charge);

  const onAction = () => {
    input.pressInteract = true;
    if (navigator.vibrate) navigator.vibrate(10);
  };
  const onRelease = () => {
    if (!hud.canRelease) return;
    input.pressRelease = true;
    if (navigator.vibrate) navigator.vibrate(20);
  };

  return (
    <div className="actions">
      <button
        type="button"
        className="action-btn"
        disabled={!hud.canAction}
        onPointerDown={(e) => {
          e.preventDefault();
          onAction();
        }}
        aria-label={hud.actionLabel}
      >
        <span className="glyph">●</span>
        <span>{hud.actionLabel}</span>
      </button>
      <button
        type="button"
        className="action-btn release"
        disabled={!hud.canRelease}
        onPointerDown={(e) => {
          e.preventDefault();
          onRelease();
        }}
        aria-label="Release"
      >
        <span className="glyph">▶</span>
        <span>Release</span>
        <span className="charge-ring" aria-hidden>
          <svg viewBox="0 0 100 100">
            <circle className="track" cx="50" cy="50" r="46" />
            <circle
              className="fill"
              cx="50"
              cy="50"
              r="46"
              style={{
                strokeDasharray: `${dashLength}`,
                strokeDashoffset: `${offset}`,
              }}
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
