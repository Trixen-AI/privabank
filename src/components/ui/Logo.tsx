import { WORDMARK_PATH_A, WORDMARK_PATH_B, WORDMARK_VIEWBOX } from "./wordmark";

/**
 * PrivaBank logomark.
 *
 * Concept: a solid "P" whose counter is cut as a keyhole, with a small chip set
 * apart below the bowl. The P is the account, solid because nobody outside can
 * read it. The keyhole is the permission to spend: PrivaBank authorizes, it does
 * not expose ownership. The chip is the payment, detached from the letter with
 * no line joining them, the way a PrivaBank payment leaves no link back to the
 * account that made it.
 *
 * Geometry sits on a 64 grid with 5px corner radii to match the UI's rounded,
 * solid shape language. No strokes, so it holds up as a 16px favicon.
 * scripts/export-brand.mjs and the dot matrix in viz/Scenes.tsx reuse these
 * coordinates; change all three together.
 */
const MARK_P =
  "M19 10H36A14 14 0 0 1 36 38H26V49A5 5 0 0 1 21 54H19A5 5 0 0 1 14 49V15A5 5 0 0 1 19 10Z";
// Keyhole: one continuous subpath (bowl + tapered slot). Two overlapping
// subpaths would flip back to solid under the even-odd fill rule.
const MARK_KEYHOLE = "M40.1 25.59A4.6 4.6 0 1 0 35.9 25.59L36.5 32.5H39.5Z";
const MARK_CHIP = { x: 34, y: 43, w: 14, h: 11, r: 3.5 };

export function Logomark({ inverted = false, className = "logomark" }: { inverted?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d={`${MARK_P} ${MARK_KEYHOLE}`}
        fillRule="evenodd"
        clipRule="evenodd"
        fill={inverted ? "var(--jade-400)" : "var(--accent)"}
      />
      <rect
        x={MARK_CHIP.x}
        y={MARK_CHIP.y}
        width={MARK_CHIP.w}
        height={MARK_CHIP.h}
        rx={MARK_CHIP.r}
        fill={inverted ? "var(--jade-200)" : "var(--jade-400)"}
      />
    </svg>
  );
}

export function Wordmark({ className = "wordmark" }: { className?: string }) {
  return (
    <svg className={className} viewBox={WORDMARK_VIEWBOX} xmlns="http://www.w3.org/2000/svg" aria-label="PrivaBank">
      <path className="wm-a" d={WORDMARK_PATH_A} />
      <path className="wm-b" d={WORDMARK_PATH_B} />
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
