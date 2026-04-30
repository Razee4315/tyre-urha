import { useEffect, useState } from "react";

type Props = { onDone: () => void };

const TIPS = [
  "Hint: walk close to the tyre, then tap Pick.",
  "Hint: place the tyre on the rollers and watch the charge ring.",
  "Hint: a fuller charge means a faster launch.",
  "Hint: aim with the look swipe before placing.",
];

export function Loading({ onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1100; // simulated minimum splash so users see the brand

    const tick = () => {
      const t = performance.now() - start;
      const p = Math.min(1, t / duration);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="screen loading">
      <div className="screen-bg" />
      <h1>Loading…</h1>
      <div className="loading-bar">
        <div className="loading-bar-fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="loading-tip">{tip}</p>
    </div>
  );
}
