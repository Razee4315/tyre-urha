import { useCallback, useEffect, useState } from "react";
import { Splash } from "./screens/Splash";
import { Loading } from "./screens/Loading";
import { Menu } from "./screens/Menu";
import { Settings as SettingsScreen } from "./screens/Settings";
import { Themes } from "./screens/Themes";
import { Game } from "./screens/Game";
import { Pause } from "./screens/Pause";
import { Win } from "./screens/Win";
import { applyThemeCssVars } from "./lib/themes";
import { loadSettings, loadStats, saveSettings, saveStats } from "./lib/storage";
import type { Screen, Settings, Stats } from "./lib/types";
import { audio } from "./lib/audio";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [winSpeed, setWinSpeed] = useState(0);

  useEffect(() => {
    applyThemeCssVars(settings.themeId);
  }, [settings.themeId]);

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveStats(stats), [stats]);

  useEffect(() => {
    audio.setMuted(!settings.sfxOn);
  }, [settings.sfxOn]);

  // Android back button → graceful navigation
  useEffect(() => {
    const onPop = () => {
      setScreen((s) => {
        if (s === "play") return "pause";
        if (s === "settings" || s === "themes" || s === "pause" || s === "win") return "menu";
        return s;
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handlePlay = useCallback(() => {
    void audio.unlock();
    setScreen("loading");
  }, []);

  const handleLoadingDone = useCallback(() => setScreen("play"), []);

  const handleWin = useCallback((speed: number, nextStats: Stats) => {
    setWinSpeed(speed);
    setStats(nextStats);
    setScreen("win");
  }, []);

  const handlePause = useCallback(() => setScreen("pause"), []);
  const handleResume = useCallback(() => setScreen("play"), []);
  const handleMenu = useCallback(() => setScreen("menu"), []);

  const inGame = screen === "play" || screen === "pause" || screen === "win";

  return (
    <>
      {/* Game stays mounted across play/pause/win to avoid scene tear-down */}
      {inGame ? (
        <Game
          settings={settings}
          stats={stats}
          onPause={handlePause}
          onWin={handleWin}
          paused={screen === "pause"}
        />
      ) : null}

      {screen === "splash" ? <Splash onDone={() => setScreen("menu")} /> : null}
      {screen === "loading" ? <Loading onDone={handleLoadingDone} /> : null}
      {screen === "menu" ? (
        <Menu
          settings={settings}
          stats={stats}
          onPlay={handlePlay}
          onThemes={() => setScreen("themes")}
          onSettings={() => setScreen("settings")}
        />
      ) : null}
      {screen === "settings" ? (
        <SettingsScreen
          settings={settings}
          onChange={setSettings}
          onBack={() => setScreen("menu")}
        />
      ) : null}
      {screen === "themes" ? (
        <Themes
          settings={settings}
          onChange={setSettings}
          onBack={() => setScreen("menu")}
        />
      ) : null}
      {screen === "pause" ? <Pause onResume={handleResume} onMenu={handleMenu} /> : null}
      {screen === "win" ? (
        <Win
          speed={winSpeed}
          best={stats.bestSpeed}
          onAgain={() => setScreen("play")}
          onMenu={handleMenu}
        />
      ) : null}
    </>
  );
}
