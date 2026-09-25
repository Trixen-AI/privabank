/**
 * Tile illustrations for "The shift". One drawing grammar: 1.5px jade strokes
 * on the dark tile, bone for the subject, dashed lines for anything public.
 */
const J = "var(--pv-accent)";
const B = "var(--pv-fg)";
const D = "var(--pv-line-strong)";

/** A glass house: the walls are dashed (see-through) and the ledger inside is readable. */
export function GlassHouseArt() {
  return (
    <svg viewBox="0 0 280 180" fill="none" aria-hidden="true">
      <path d="M60 78 140 26l80 52v82H60Z" stroke={B} strokeWidth="1.5" strokeDasharray="4 5" />
      <path d="M44 88 140 18l96 70" stroke={B} strokeWidth="1.5" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(88 ${88 + i * 16})`}>
          <rect width="104" height="9" rx="2" fill={D} />
          <rect width={36 + ((i * 29) % 52)} height="9" rx="2" fill={J} opacity="0.75" />
        </g>
      ))}
      {[34, 246].map((x) => (
        <g key={x} transform={`translate(${x} 128)`}>
          <ellipse rx="15" ry="9" stroke={J} strokeWidth="1.5" />
          <circle r="4" fill={J} />
        </g>
      ))}
    </svg>
  );
}

/** Separate coins falling into one pool, where they stop being told apart. */
export function PoolArt() {
  return (
    <svg viewBox="0 0 280 180" fill="none" aria-hidden="true">
      {[
        [70, 22],
        [118, 40],
        [168, 18],
        [212, 36],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="11" stroke={B} strokeWidth="1.5" />
          <path d={`M${x} ${y + 16}v${40 - y / 2}`} stroke={B} strokeWidth="1.5" strokeDasharray="2 4" />
        </g>
      ))}
      <ellipse cx="140" cy="122" rx="112" ry="26" stroke={J} strokeWidth="1.5" />
      <path d="M28 122v24c0 14 50 26 112 26s112-12 112-26v-24" stroke={J} strokeWidth="1.5" />
      {Array.from({ length: 22 }, (_, i) => {
        const x = 52 + (i % 11) * 17;
        const y = 116 + Math.floor(i / 11) * 12;
        return <circle key={i} cx={x} cy={y} r="2.4" fill={J} opacity={0.35 + ((i * 7) % 10) / 16} />;
      })}
    </svg>
  );
}

/** A card whose number is replaced by a keyhole: it authorizes, it doesn't expose. */
export function NeobankArt() {
  return (
    <svg viewBox="0 0 280 180" fill="none" aria-hidden="true">
      <rect x="56" y="30" width="168" height="106" rx="14" stroke={B} strokeWidth="1.5" />
      <rect x="74" y="52" width="26" height="19" rx="4" stroke={B} strokeWidth="1.5" />
      <path d="M74 110h44M126 110h16" stroke={B} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="188" cy="74" r="14" fill={J} opacity="0.16" stroke={J} strokeWidth="1.5" />
      <circle cx="188" cy="70" r="4.5" fill={J} />
      <path d="M185.6 73h4.8l-1 9h-2.8Z" fill={J} />
      <path d="M140 150v14M126 158l14 12 14-12" stroke={J} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
