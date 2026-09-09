import type { EnvironmentTheme } from "../data/editor";

interface CloudsProps {
  w: number;
  h: number;
  environment?: EnvironmentTheme;
}

export function Clouds({ w, h, environment = "day" }: CloudsProps) {
  const isNight = environment === "night";
  const isDusk = environment === "dusk";
  const isOvercast = environment === "overcast";

  // Cloud fills matching the environment
  const fills = isNight
    ? ["#13243a", "#1a314d", "#223d5e"]
    : isDusk
    ? ["#f29b7d", "#ea8782", "#b3688b"]
    : isOvercast
    ? ["#a8b9bf", "#b5c5cb", "#c5d3d8"]
    : ["#c7e3ee", "#d2e9f1", "#dceef4"];

  const row = (y: number, radius: number, fill: string, offset: number, opacity = 1) => (
    <g opacity={opacity}>
      <rect y={y} width={w} height={radius * 2.2} fill={fill} />
      {Array.from({ length: Math.ceil(w / (radius * 1.35)) + 2 }, (_, i) => (
        <circle
          key={i}
          cx={i * radius * 1.35 - radius + offset + ((i * 37) % 23)}
          cy={y}
          r={radius * (0.82 + (((i * 53) % 30) / 100))}
          fill={fill}
        />
      ))}
    </g>
  );

  return (
    <svg
      className="absolute inset-x-0 bottom-0 pointer-events-none"
      width="100%"
      height={h * 2}
      viewBox={`0 0 ${w} ${h * 2}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {/* Night starfield */}
      {isNight && (
        <g opacity="0.85">
          {Array.from({ length: Math.max(30, Math.floor(w / 35)) }, (_, i) => {
            const cx = (i * 97) % w;
            const cy = (i * 47) % (h * 0.95);
            const r = (i % 3 === 0 ? 1.6 : i % 2 === 0 ? 1.2 : 0.8);
            const op = 0.35 + (i % 5) * 0.15;
            return <circle key={`star-${i}`} cx={cx} cy={cy} r={r} fill="#fff9e6" opacity={op} />;
          })}
          {/* Streetmix Moon */}
          <g transform={`translate(${Math.max(120, w - 180)} 30) scale(0.42)`}>
            <circle cx="100" cy="100" r="94" fill="#e4e2dc" />
            <path
              d="M173-46l60 40 25 67-19 69-56 45-72 3-60-40-25-67 20-69 56-44 71-3z"
              fill="#f6f4ef"
              opacity="0.9"
            />
            {/* Crater details */}
            <circle cx="70" cy="65" r="16" fill="#d8d5ce" opacity="0.6" />
            <circle cx="130" cy="120" r="22" fill="#d8d5ce" opacity="0.6" />
            <circle cx="120" cy="55" r="11" fill="#d8d5ce" opacity="0.5" />
            <circle cx="65" cy="125" r="14" fill="#d8d5ce" opacity="0.5" />
          </g>
        </g>
      )}

      {/* Sun glow for dusk */}
      {isDusk && (
        <circle cx={w * 0.72} cy={h * 1.1} r={h * 0.7} fill="#ffbe6b" opacity="0.32" filter="blur(20px)" />
      )}

      {/* Cloud puff tiers */}
      {row(h * 0.52, h * 0.34, fills[0], 10, isNight ? 0.7 : 1)}
      {row(h * 1.05, h * 0.42, fills[1], 60, isNight ? 0.8 : 1)}
      {row(h * 1.6, h * 0.5, fills[2], 0, isNight ? 0.9 : 1)}
    </svg>
  );
}
