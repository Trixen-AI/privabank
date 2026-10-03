import { useId } from "react";
import { WORDMARK_PATH_A, WORDMARK_PATH_B, WORDMARK_VIEWBOX } from "./wordmark";

/**
 * Spectral logomark: a shield with an S cut through it in ink.
 *
 * Source artwork: public/brand/logo-new.jpeg (supplied by the Spectral team).
 * Rebuilt here as vector so it stays sharp at every size and sits on any
 * background; it matches the source to within 1px on the outline (99.1%
 * silhouette overlap). Coordinates are the source's own 1024 grid, cropped to
 * a 512 square around the mark by the viewBox.
 *
 * scripts/export-brand.mjs and the dot matrix in viz/Scenes.tsx reuse
 * MARK_SHIELD / MARK_S; change them together.
 */
export const MARK_SHIELD =
  "M505 266.5Q512 264 519 266.5L702 329Q718 335 718 352V490C718 604 634 694 522 755Q512 760 502 755C390 694 306 604 306 490V352Q306 335 322 329Z";
export const MARK_S = "M591 394.5H476.75A52.75 52.75 0 0 0 476.75 500H546.75A52.25 52.25 0 0 1 546.75 604.5H432";
export const MARK_VIEWBOX = "256 256 512 512";

export function Logomark({ className = "logomark" }: { inverted?: boolean; className?: string }) {
  // Each instance needs its own gradient id: several marks share a page.
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox={MARK_VIEWBOX} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="264" x2="0" y2="760" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D8A6FF" />
          <stop offset="1" stopColor="#B600FF" />
        </linearGradient>
      </defs>
      <path d={MARK_SHIELD} fill={`url(#sp-${id})`} />
      <path d={MARK_S} stroke="#050507" strokeWidth={48} strokeLinecap="round" strokeLinejoin="round" />
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
