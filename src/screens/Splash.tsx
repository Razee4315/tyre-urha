import { useEffect } from "react";
import { Logo } from "../components/Logo";

type Props = { onDone: () => void };

export function Splash({ onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1800);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="screen splash">
      <div className="screen-bg" />
      <div className="splash-rotate">
        <Logo className="splash-logo" />
      </div>
      <h1 className="splash-title">Tyre Launch</h1>
      <p className="splash-tagline">Roll. Charge. Release.</p>
      <style>{`
        .splash-rotate { animation: splash-roll 1.8s ease-out forwards; }
        @keyframes splash-roll {
          0%   { transform: translateX(-40vw) rotate(-540deg); opacity: 0; }
          60%  { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(0) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
