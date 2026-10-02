import { WORDMARK_PATH_A, WORDMARK_PATH_B, WORDMARK_VIEWBOX } from "./wordmark";

/**
 * Spectral logomark.
 *
 * Concept: an S drawn as a single band of light with a second, narrower line
 * running down its middle. The S is the name; the inner line is the spectral
 * band, the signal that runs through every payment without being visible from
 * outside it. One continuous round-capped stroke, so it reads at 16px.
 *
 * Geometry sits on a 64 grid: the band is 16 wide, the spine 6, both following
 * MARK_S with round caps and joins, matching the UI's soft corners.
 * scripts/export-brand.mjs and the dot matrix in viz/Scenes.tsx reuse MARK_S;
 * change them together.
 *
 * Colours come from the tokens: a lilac band with a violet spine on the dark
 * canvas; `inverted` (for violet or light surfaces) swaps them.
 */
export const MARK_S = "M46 14H25A9 9 0 0 0 25 32H39A9 9 0 0 1 39 50H18";

export function Logomark({ inverted = false, className = "logomark" }: { inverted?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d={MARK_S}
        stroke={inverted ? "var(--violet-500)" : "var(--violet-300)"}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={MARK_S}
        stroke={inverted ? "var(--violet-300)" : "var(--violet-500)"}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className = "wordmark" }: { className?: string }) {
  return (
    <svg className={className} viewBox={WORDMARK_VIEWBOX} xmlns="http://www.w3.org/2000/svg" aria-label="Spectral">
      <path className="wm-a" d={WORDMARK_PATH_A} />
      {WORDMARK_PATH_B ? <path className="wm-b" d={WORDMARK_PATH_B} /> : null}
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <>
      <Logomark inverted={inverted} />
      <Wordmark />
    </>
  );
}
