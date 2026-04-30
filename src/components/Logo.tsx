type LogoProps = {
  className?: string;
  size?: number;
};

/**
 * Tyre Launch logo: stylised wheel with motion lines and a target. All
 * vector + fully themable through CSS variables, ships zero raster bytes.
 */
export function Logo({ className, size = 220 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tyre Launch logo"
    >
      <defs>
        <radialGradient id="tl-rim" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff5dc" />
          <stop offset="1" stopColor="#9aa3aa" />
        </radialGradient>
        <linearGradient id="tl-tyre" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f2226" />
          <stop offset="1" stopColor="#0a0c0d" />
        </linearGradient>
        <linearGradient id="tl-flame" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--accent, #ffae33)" />
          <stop offset="1" stopColor="var(--accent-2, #ff7138)" />
        </linearGradient>
      </defs>

      {/* Motion streaks */}
      <g opacity="0.9">
        <path d="M14 96 H64" stroke="url(#tl-flame)" strokeWidth="6" strokeLinecap="round" />
        <path d="M22 128 H72" stroke="url(#tl-flame)" strokeWidth="8" strokeLinecap="round" />
        <path d="M14 160 H64" stroke="url(#tl-flame)" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* Outer rubber */}
      <circle cx="160" cy="128" r="80" fill="url(#tl-tyre)" />
      <circle
        cx="160"
        cy="128"
        r="80"
        fill="none"
        stroke="#0a0c0d"
        strokeWidth="2"
      />

      {/* Tread blocks */}
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const cx = 160 + Math.cos(angle) * 76;
        const cy = 128 + Math.sin(angle) * 76;
        return (
          <rect
            key={i}
            x={cx - 5}
            y={cy - 8}
            width="10"
            height="16"
            rx="2"
            fill="#0a0c0d"
            transform={`rotate(${(angle * 180) / Math.PI + 90} ${cx} ${cy})`}
          />
        );
      })}

      {/* Inner alloy */}
      <circle cx="160" cy="128" r="42" fill="url(#tl-rim)" />
      <circle cx="160" cy="128" r="42" fill="none" stroke="#5a6068" strokeWidth="2" />

      {/* Spokes */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <rect
            key={i}
            x={154}
            y={92}
            width="12"
            height="36"
            rx="3"
            fill="#cfd5db"
            stroke="#5a6068"
            strokeWidth="1"
            transform={`rotate(${(angle * 180) / Math.PI} 160 128)`}
          />
        );
      })}

      {/* Hub */}
      <circle cx="160" cy="128" r="11" fill="#404549" stroke="#22272b" strokeWidth="2" />
      <circle cx="160" cy="128" r="3" fill="var(--accent, #ffae33)" />
    </svg>
  );
}
