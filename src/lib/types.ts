export type Screen =
  | "splash"
  | "loading"
  | "menu"
  | "settings"
  | "themes"
  | "play"
  | "pause"
  | "win";

export type Difficulty = "easy" | "normal" | "hard";

export type ThemeId = "desert" | "sunset" | "night" | "snow";

export type Settings = {
  themeId: ThemeId;
  difficulty: Difficulty;
  sfxOn: boolean;
  hapticsOn: boolean;
};

export type Stats = {
  bestSpeed: number;
  totalHits: number;
  totalLaunches: number;
};

export type GameInputState = {
  /** Joystick vector in [-1,1] range */
  moveX: number;
  moveY: number;
  /** Per-frame look delta in CSS pixels (consumed each tick) */
  lookDx: number;
  lookDy: number;
  /** Discrete button press flags (set true once, consumed by engine each tick) */
  pressInteract: boolean;
  pressRelease: boolean;
};

export type GameHudState = {
  /** Roller charge 0..1 */
  charge: number;
  /** Tyre lifecycle status */
  status: string;
  /** Whether the release button should be enabled */
  canRelease: boolean;
  /** Context label for the action button: Pick / Drop / Place / Carry */
  actionLabel: string;
  /** Whether action button is enabled */
  canAction: boolean;
  /** Most recent successful release speed (for win screen) */
  lastReleaseSpeed: number;
  /** True after a tower hit until reset */
  hit: boolean;
};

export type GameEvents = {
  onHud: (state: GameHudState) => void;
  onWin: (releaseSpeed: number) => void;
};
