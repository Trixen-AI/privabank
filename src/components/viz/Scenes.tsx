import { useCanvas } from "../../hooks";
import { MARK_S, MARK_SHIELD } from "../ui/Logo";

/**
 * Shielded pool scene (dark card in the paradigm section).
 *
 * Original Canvas 2D drawing. Distinct notes fall from the top, hit a surface
 * line, and break apart into an even field of identical dots: the moment a
 * deposit stops being individually addressable. Nothing below the line can be
 * told apart from anything else below the line.
 */
export function PoolScene() {
  const ref = useCanvas((ctx, t, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const surfaceY = h * 0.52;

    // --- the anonymity set: an even lattice that shimmers as one body ---
    const gap = 13;
    for (let y = surfaceY + gap; y < h + gap; y += gap) {
      for (let x = (gap / 2) % gap; x < w; x += gap) {
        const depth = (y - surfaceY) / (h - surfaceY);
        const shimmer = 0.5 + 0.5 * Math.sin(t * 1.1 + x * 0.045 + y * 0.03);
        const a = (0.1 + shimmer * 0.2) * (1 - depth * 0.45);
        ctx.fillStyle = `rgba(215, 173, 255, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- the surface of the pool ---
    const grad = ctx.createLinearGradient(0, surfaceY - 30, 0, surfaceY + 30);
    grad.addColorStop(0, "rgba(215, 173, 255,0)");
    grad.addColorStop(0.5, "rgba(215, 173, 255,0.42)");
    grad.addColorStop(1, "rgba(215, 173, 255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, surfaceY - 30, w, 60);

    // --- falling notes, each one distinct until it lands ---
    const NOTES = 7;
    for (let i = 0; i < NOTES; i++) {
      const period = 4.2 + i * 0.63;
      const phase = ((t + i * 1.37) % period) / period;
      const x = w * (0.12 + ((i * 0.41) % 1) * 0.78);
      const y = -20 + phase * (surfaceY + 30);
      if (y > surfaceY) {
        // landed: a ripple spreading out from the entry point
        const age = (y - surfaceY) / 30;
        ctx.strokeStyle = `rgba(238, 223, 255,${(0.5 * (1 - age)).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(x, surfaceY, 12 + age * 46, 4 + age * 13, 0, 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }
      // a note: a small rounded rectangle with its own denomination bar
      const fade = Math.min(1, (surfaceY - y) / 40);
      ctx.save();
      ctx.globalAlpha = 0.85 * fade;
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 0.9 + i) * 0.16);
      ctx.fillStyle = "rgba(182, 0, 255,0.5)";
      ctx.strokeStyle = "rgba(227, 199, 255,0.85)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-13, -8, 26, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(238, 223, 255,0.75)";
      ctx.fillRect(-8, -2.5, 8 + ((i * 3) % 7), 2);
      ctx.restore();
    }
  });

  return <canvas className="ic-canvas" ref={ref} aria-hidden="true" />;
}

/**
 * Settlement sweep (compliance panel background).
 *
 * Original Canvas 2D drawing. A dense dot field carries a travelling band of
 * light from left to right: the verification pass moving through the ledger.
 * Ahead of the band the dots are dim and undifferentiated, behind it they settle
 * to a steady, cleared lilac. Privacy going in, clean settlement coming out.
 */
export function SettlementScene() {
  const ref = useCanvas((ctx, t, w, h) => {
    ctx.clearRect(0, 0, w, h);

    const gap = 18;
    const cols = Math.ceil(w / gap) + 1;
    const rows = Math.ceil(h / gap) + 1;
    const sweep = ((t * 0.19) % 1.45) - 0.22; // 0 -> 1 across the panel, with a gap between passes
    const sweepX = sweep * w;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * gap + (r % 2 ? gap / 2 : 0);
        const y = r * gap;

        const d = (x - sweepX) / (w * 0.14);
        // in front of the band: dim. inside it: bright. behind: cleared.
        const inBand = Math.exp(-d * d);
        const cleared = d < 0 ? 1 : 0;
        const idle = 0.5 + 0.5 * Math.sin(t * 0.7 + c * 0.2 + r * 0.35);

        const alpha = 0.06 + idle * 0.05 + cleared * 0.13 + inBand * 0.62;
        const radius = 1.1 + inBand * 2.2 + cleared * 0.35;

        ctx.fillStyle =
          inBand > 0.25
            ? `rgba(238, 223, 255,${Math.min(1, alpha).toFixed(3)})`
            : `rgba(197, 124, 255,${Math.min(1, alpha).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // the leading edge of the pass
    const edge = ctx.createLinearGradient(sweepX - 90, 0, sweepX + 30, 0);
    edge.addColorStop(0, "rgba(215, 173, 255,0)");
    edge.addColorStop(0.75, "rgba(215, 173, 255,0.16)");
    edge.addColorStop(1, "rgba(215, 173, 255,0)");
    ctx.fillStyle = edge;
    ctx.fillRect(sweepX - 90, 0, 120, h);
  });

  return (
    <div className="bt-thorns" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}

/* The Spectral mark as a lookup mask, so the dot matrix can light it up at any
   size without an image file: the shield is filled and the S is cut out of it,
   from the same paths as ui/Logo.tsx, rasterised once to a small grid. */
const MASK_SIZE = 128;
let markMask: Uint8Array | null = null;

function buildMarkMask() {
  const c = document.createElement("canvas");
  c.width = c.height = MASK_SIZE;
  const ctx = c.getContext("2d");
  if (!ctx) return new Uint8Array(MASK_SIZE * MASK_SIZE);
  // MARK_VIEWBOX is "256 256 512 512": map that square onto the grid.
  ctx.scale(MASK_SIZE / 512, MASK_SIZE / 512);
  ctx.translate(-256, -256);
  ctx.fill(new Path2D(MARK_SHIELD));
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = 48;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(MARK_S));
  const data = ctx.getImageData(0, 0, MASK_SIZE, MASK_SIZE).data;
  const mask = new Uint8Array(MASK_SIZE * MASK_SIZE);
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > 127 ? 1 : 0;
  return mask;
}

function markAlpha(u: number, v: number) {
  markMask ??= buildMarkMask();
  const x = Math.min(MASK_SIZE - 1, Math.floor(u * MASK_SIZE));
  const y = Math.min(MASK_SIZE - 1, Math.floor(v * MASK_SIZE));
  return markMask[y * MASK_SIZE + x];
}

/**
 * Dot-matrix panel background (token section).
 *
 * Original Canvas 2D renderer. Dots on a fixed grid grow and brighten where the
 * Spectral mark sits, and a ripple travels outward from the mark so the
 * silhouette keeps breathing. The mark is evaluated geometrically, so there is
 * no bitmap behind it.
 */
export function DotMatrixPanel() {
  const ref = useCanvas((ctx, t, w, h) => {
    ctx.clearRect(0, 0, w, h);

    const cols = 92;
    const gap = w / cols;
    const rows = Math.ceil(h / gap);

    // Centre the mark behind the whole panel as a quiet watermark.
    const markH = Math.min(h * 0.96, w * 0.52);
    const markW = markH;
    const markX = w / 2 - markW / 2;
    const markY = h / 2 - markH * 0.5;

    const cx = w / 2;
    const cy = markY + markH * 0.55;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * gap + gap / 2;
        const y = r * gap + gap / 2;

        const u = (x - markX) / markW;
        const v = (y - markY) / markH;
        const on = u >= 0 && u <= 1 && v >= 0 && v <= 1 ? markAlpha(u, v) : 0;

        // ripple travelling out from the mark, 5.6s loop
        const dist = Math.hypot(x - cx, y - cy) / Math.max(w, h);
        const ripple = Math.sin(dist * 22 - (t / 5.6) * Math.PI * 2 * 1.1);
        const pulse = 0.5 + 0.5 * ripple;

        const alpha = on ? 0.16 + pulse * 0.16 : 0.06 + pulse * 0.07;
        const radius = (on ? 0.26 + pulse * 0.1 : 0.12 + pulse * 0.05) * gap;

        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  return (
    <div className="token-bg" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
