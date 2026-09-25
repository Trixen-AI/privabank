import { WORDMARK_PATH_A, WORDMARK_PATH_B, WORDMARK_VIEWBOX } from "./wordmark";

/**
 * CassaFi logomark.
 *
 * Concept: "cassa" is the till, the strongbox a shop keeps its takings in. The
 * mark is that box drawn as a C: a thick, soft-cornered frame open on one side,
 * with a single solid note held inside it. The note has no number and no label
 * on it, the way a CassaFi balance is held without being readable from outside.
 * The open side is the permission to spend: money leaves by authorization, not
 * by someone reaching in.
 *
 * Geometry sits on a 64 grid. The frame is a 12-unit round-capped stroke whose
 * corners bend on a 13-unit radius, matching the site's pill and soft-card shape
 * language, and the note is a 4-unit-radius square. It holds up as a 16px
 * favicon. scripts/export-brand.mjs repeats these values; change both together.
 */
const MARK_FRAME = "M47 14H27A13 13 0 0 0 14 27V37A13 13 0 0 0 27 50H47";
const MARK_FRAME_WIDTH = 12;
const MARK_NOTE = { x: 33, y: 25, w: 14, h: 14, r: 4 };

export function Logomark({ inverted = false, className = "logomark" }: { inverted?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        className="lm-frame"
        d={MARK_FRAME}
        stroke={inverted ? "var(--jade-300)" : "var(--accent)"}
        strokeWidth={MARK_FRAME_WIDTH}
        strokeLinecap="round"
      />
      <rect
        className="lm-note"
        x={MARK_NOTE.x}
        y={MARK_NOTE.y}
        width={MARK_NOTE.w}
        height={MARK_NOTE.h}
        rx={MARK_NOTE.r}
        fill="var(--jade-100)"
      />
    </svg>
  );
}

export function Wordmark({ className = "wordmark" }: { className?: string }) {
  return (
    <svg className={className} viewBox={WORDMARK_VIEWBOX} xmlns="http://www.w3.org/2000/svg" aria-label="CassaFi">
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
