import type { ThemeId } from "./types";

export type Theme = {
  id: ThemeId;
  label: string;
  /** Three.js scene clear color */
  sky: number;
  /** Fog colour (usually same hue as sky) */
  fog: number;
  fogNear: number;
  fogFar: number;
  /** Ground / dust tint */
  ground: number;
  /** Lane colour */
  lane: number;
  /** Wall main / dark colours */
  wall: number;
  wallDark: number;
  /** Tree foliage / trunks */
  leaf: number;
  trunk: number;
  /** Tower body colour */
  tower: number;
  towerCap: number;
  /** Sun + hemisphere lighting */
  sunColor: number;
  sunIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  /** Accent (UI + arrows) */
  accent: string;
  accent2: string;
  /** UI base */
  uiBg: string;
  uiText: string;
};

export const THEMES: Record<ThemeId, Theme> = {
  desert: {
    id: "desert",
    label: "Desert",
    sky: 0xaed0e6,
    fog: 0xaed0e6,
    fogNear: 18,
    fogFar: 74,
    ground: 0xb9965f,
    lane: 0xc4a16a,
    wall: 0xc9a06c,
    wallDark: 0x9f7347,
    leaf: 0x47793d,
    trunk: 0x624026,
    tower: 0xb77f55,
    towerCap: 0x6f4b36,
    sunColor: 0xffe1a3,
    sunIntensity: 2.25,
    hemiSky: 0xf5fbff,
    hemiGround: 0x6b4d29,
    hemiIntensity: 1.45,
    accent: "#ffae33",
    accent2: "#ff7138",
    uiBg: "rgba(20, 16, 11, 0.78)",
    uiText: "#fff2d2",
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    sky: 0xff8b5c,
    fog: 0xf16c4f,
    fogNear: 16,
    fogFar: 70,
    ground: 0x8a4f3a,
    lane: 0xb96b48,
    wall: 0xd07b56,
    wallDark: 0x7a3f2c,
    leaf: 0x5a3d2e,
    trunk: 0x3a1f15,
    tower: 0x4d2a1c,
    towerCap: 0x2a160e,
    sunColor: 0xffb47a,
    sunIntensity: 2.6,
    hemiSky: 0xffb27a,
    hemiGround: 0x431e14,
    hemiIntensity: 1.3,
    accent: "#ffd166",
    accent2: "#ff5a36",
    uiBg: "rgba(34, 12, 6, 0.78)",
    uiText: "#ffe4c4",
  },
  night: {
    id: "night",
    label: "Night Neon",
    sky: 0x07091a,
    fog: 0x070a1a,
    fogNear: 16,
    fogFar: 56,
    ground: 0x14182b,
    lane: 0x1d2645,
    wall: 0x222a48,
    wallDark: 0x10142a,
    leaf: 0x1a3357,
    trunk: 0x0a0e1e,
    tower: 0x1d2546,
    towerCap: 0x101632,
    sunColor: 0x7aa9ff,
    sunIntensity: 1.0,
    hemiSky: 0x355aff,
    hemiGround: 0x05060f,
    hemiIntensity: 0.7,
    accent: "#22d3ee",
    accent2: "#a855f7",
    uiBg: "rgba(8, 10, 24, 0.82)",
    uiText: "#dbeafe",
  },
  snow: {
    id: "snow",
    label: "Snow",
    sky: 0xd9e6ec,
    fog: 0xd9e6ec,
    fogNear: 14,
    fogFar: 60,
    ground: 0xeaf3f6,
    lane: 0xc4d5da,
    wall: 0xa9bcc4,
    wallDark: 0x6e8087,
    leaf: 0x6f8a7a,
    trunk: 0x3e2a1e,
    tower: 0x9aaab1,
    towerCap: 0x4a585e,
    sunColor: 0xeaf3ff,
    sunIntensity: 1.9,
    hemiSky: 0xf6fbff,
    hemiGround: 0x9eb5be,
    hemiIntensity: 1.6,
    accent: "#38bdf8",
    accent2: "#0ea5e9",
    uiBg: "rgba(20, 28, 36, 0.78)",
    uiText: "#eaf3f6",
  },
};

export function getTheme(id: ThemeId): Theme {
  return THEMES[id] ?? THEMES.desert;
}

export function applyThemeCssVars(id: ThemeId): void {
  const t = THEMES[id] ?? THEMES.desert;
  const root = document.documentElement.style;
  root.setProperty("--accent", t.accent);
  root.setProperty("--accent-2", t.accent2);
  root.setProperty("--ui-bg", t.uiBg);
  root.setProperty("--ui-text", t.uiText);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", `#${(t.sky & 0xffffff).toString(16).padStart(6, "0")}`);
}
