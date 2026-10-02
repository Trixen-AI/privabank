/**
 * Original Spectral artwork: a dotted grid overlay, the whitepaper cover marks,
 * a small phone mock for the CTA panel, and the wide illustration in the
 * "private neobanking" card. All drawn by hand as inline SVG from the token
 * palette, so they stay sharp and re-colour with the theme.
 */

/** A dotted field used behind the paper covers. */
export function DotField({ gap = 17, dot = 1.3, opacity = 0.3 }: { gap?: number; dot?: number; opacity?: number }) {
  const id = `dots-${gap}-${dot}`;
  return (
    <svg className="dots" width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
          <circle cx={gap / 2} cy={gap / 2} r={dot / 2} fill="#fff" />
        </pattern>
        <radialGradient id={`${id}-mask`} cx="50%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-m`}>
          <rect width="100%" height="100%" fill={`url(#${id}-mask)`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} mask={`url(#${id}-m)`} />
    </svg>
  );
}

/**
 * Cover mark for the protocol paper: concentric authorization rings around a
 * closed aperture, with one ring broken where a proof passes through.
 */
export function PaperMarkSpectral() {
  return (
    <svg className="paper-art" viewBox="0 0 286 320" fill="none" aria-hidden="true">
      <g stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none">
        <circle cx="143" cy="168" r="112" strokeDasharray="3 9" />
        <circle cx="143" cy="168" r="88" />
        <circle cx="143" cy="168" r="64" strokeDasharray="42 120" strokeLinecap="round" />
      </g>
      <g stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M143 56v26M143 254v26M31 168h26M229 168h26" />
      </g>
      <circle cx="143" cy="168" r="34" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" />
      <path d="M143 152a11 11 0 1 1 0 22 11 11 0 0 1 0-22Z" fill="rgba(255,255,255,0.9)" />
      <path d="M138.6 174h8.8l-2 20h-4.8l-2-20Z" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}

/**
 * Cover mark for the compliance paper: a stack of audit rows where only the
 * summary line is legible and every underlying row stays redacted.
 */
export function PaperMarkWarden() {
  return (
    <svg className="paper-art" viewBox="0 0 286 320" fill="none" aria-hidden="true">
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i} transform={`translate(52 ${96 + i * 26})`}>
            <rect width="182" height="14" rx="3" fill="rgba(215, 173, 255,0.09)" />
            <rect width={54 + ((i * 37) % 96)} height="14" rx="3" fill="rgba(215, 173, 255,0.22)" />
            <rect x={150} width="32" height="14" rx="3" fill="rgba(215, 173, 255,0.14)" />
          </g>
        ))}
      </g>
      <rect
        x="42"
        y="56"
        width="202"
        height="26"
        rx="5"
        fill="rgba(215, 173, 255,0.16)"
        stroke="rgba(227, 199, 255,0.6)"
        strokeWidth="1.2"
      />
      <path
        d="M56 69l6 6 12-13"
        stroke="rgba(227, 199, 255,0.95)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="86" y="65" width="120" height="6" rx="3" fill="rgba(227, 199, 255,0.55)" />
      <g stroke="rgba(215, 173, 255,0.4)" strokeWidth="1.2" strokeDasharray="4 6">
        <path d="M42 262h202" />
      </g>
      <text
        x="143"
        y="286"
        textAnchor="middle"
        fill="rgba(238, 223, 255,0.75)"
        fontFamily="ui-monospace, monospace"
        fontSize="11"
        letterSpacing="3"
      >
        VERIFIED
      </text>
    </svg>
  );
}

/**
 * The phone mock in the CTA panel: a shielded balance card with a masked
 * account line and two recent payments whose counterparties stay hidden.
 */
export function PhoneMock({ label, amount }: { label: string; amount: string }) {
  return (
    <svg width="168" height="270" viewBox="0 0 168 270" fill="none" role="img" aria-label={`${label} ${amount}`}>
      <rect x="1" y="1" width="166" height="268" rx="24" fill="rgba(5, 5, 7,0.72)" stroke="rgba(255,255,255,0.28)" />
      <rect x="9" y="9" width="150" height="252" rx="18" fill="rgba(5, 5, 7,0.62)" />
      <rect x="62" y="17" width="44" height="6" rx="3" fill="rgba(255,255,255,0.22)" />

      <text x="26" y="58" fill="rgba(238, 223, 255,0.75)" fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing="2">
        {label.toUpperCase()}
      </text>
      <text x="26" y="84" fill="#ffffff" fontFamily="ui-monospace, monospace" fontSize="21">
        {amount}
      </text>

      <g>
        <rect x="26" y="98" width="72" height="7" rx="3.5" fill="rgba(255,255,255,0.16)" />
        <rect x="102" y="98" width="24" height="7" rx="3.5" fill="rgba(215, 173, 255,0.45)" />
      </g>

      <rect x="18" y="122" width="132" height="1" fill="rgba(255,255,255,0.12)" />

      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(26 ${138 + i * 34})`}>
          <rect width="26" height="26" rx="8" fill="rgba(215, 173, 255,0.16)" />
          <rect x="7" y="9" width="12" height="8" rx="2" fill="rgba(227, 199, 255,0.7)" />
          <rect x="36" y="3" width={52 - i * 9} height="6" rx="3" fill="rgba(255,255,255,0.3)" />
          <rect x="36" y="15" width={34 + i * 7} height="5" rx="2.5" fill="rgba(255,255,255,0.14)" />
          <rect x={92 + i * 4} y="9" width={24 - i * 4} height="7" rx="3.5" fill="rgba(238, 223, 255,0.55)" />
        </g>
      ))}

      <rect x="26" y="244" width="116" height="1" fill="rgba(255,255,255,0.1)" />
      <g transform="translate(26 226)">
        <rect width="116" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />
        <rect width="74" height="3" rx="1.5" fill="rgba(215, 173, 255,0.6)" />
      </g>
    </svg>
  );
}

/**
 * Wide illustration for the "private neobanking" card: a card, an authorization
 * proof, and a merchant till, with the proof crossing between them while the
 * balance panel behind stays sealed.
 */
export function NeobankArt() {
  const S = "rgba(215, 173, 255, 0.9)"; // lilac line
  const M = "rgba(215, 173, 255, 0.1)"; // lilac tint
  const L = "rgba(182, 0, 255, 0.75)"; // violet signal
  return (
    <svg viewBox="0 0 320 168" fill="none" role="img" aria-label="A credential authorising a payment to a merchant">
      {/* sealed balance panel */}
      <rect x="6" y="26" width="104" height="116" rx="10" fill={M} stroke={S} strokeWidth="1.4" />
      <g stroke={S} strokeWidth="1.2" strokeLinecap="round" opacity="0.5">
        <path d="M22 54h72M22 70h52M22 86h64M22 102h40" strokeDasharray="2 7" />
      </g>
      <rect x="40" y="114" width="36" height="14" rx="7" fill={S} />
      <path d="M52 121h12" stroke="#050507" strokeWidth="1.6" strokeLinecap="round" />

      {/* credential card */}
      <g transform="translate(120 40)">
        <rect width="80" height="52" rx="8" fill="#16151b" stroke={S} strokeWidth="1.4" />
        <rect x="10" y="12" width="18" height="13" rx="3" fill={L} />
        <path d="M10 36h34M10 43h22" stroke={S} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="62" cy="36" r="9" fill={M} stroke={S} strokeWidth="1.2" />
        <path d="M58 36l3 3 6-7" stroke={S} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* proof crossing to the merchant */}
      <path d="M204 66c18 0 22-22 40-22" stroke={S} strokeWidth="1.4" strokeDasharray="4 5" fill="none" />
      <path d="M240 40l6 4-6 4" stroke={S} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* merchant till */}
      <g transform="translate(244 24)">
        <rect width="70" height="120" rx="10" fill="#16151b" stroke={S} strokeWidth="1.4" />
        <rect x="12" y="14" width="46" height="30" rx="5" fill={M} stroke={S} strokeWidth="1.2" />
        <path d="M22 29h26" stroke={S} strokeWidth="1.6" strokeLinecap="round" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="12" y={56 + i * 18} width="20" height="12" rx="3" fill={L} />
            <rect x="38" y={56 + i * 18} width="20" height="12" rx="3" fill={M} stroke={S} strokeWidth="1" />
          </g>
        ))}
      </g>
    </svg>
  );
}
