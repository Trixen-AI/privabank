import { useEffect, useRef, useState } from "react";

/** True when the user has asked for reduced motion. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Cycles `words`, mirroring the reference's blur-and-lift word swap:
 * 320ms out, swap, 320ms in, then hold until the next tick.
 */
export function useRotatingWord(words: string[], holdMs = 2200) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || words.length < 2) return;
    let outTimer: number;
    const tick = window.setInterval(() => {
      setPhase("out");
      outTimer = window.setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setPhase("in");
      }, 320);
    }, holdMs + 320);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(outTimer);
    };
  }, [words.length, holdMs, reduced]);

  return { word: words[index], phase };
}

/** Fires once when the element first scrolls into view. */
export function useInView<T extends HTMLElement>(margin = "0px 0px -15% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);

  return [ref, inView] as const;
}

/**
 * Counts from 0 to `target` once visible. Formats with thousands separators so
 * the live figures read like a running ledger rather than a static number.
 */
export function useCountUp(target: number, durationMs = 1600, start = false) {
  const [value, setValue] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!start || reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      // ease-out cubic, so it settles rather than stopping dead
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start, reduced]);

  return (reduced && start ? target : value).toLocaleString("en-US");
}

/**
 * Runs `draw` on an animation frame loop against a DPR-corrected 2D canvas,
 * pausing whenever the canvas is offscreen or reduced motion is set.
 */
export function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void,
  deps: unknown[] = [],
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let visible = true;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);

    const t0 = performance.now();
    const loop = (now: number) => {
      if (visible && w > 0 && h > 0) drawRef.current(ctx, (now - t0) / 1000, w, h);
      raf = requestAnimationFrame(loop);
    };

    if (reduced) {
      // draw a single resting frame
      const once = () => {
        if (w > 0 && h > 0) drawRef.current(ctx, 0, w, h);
      };
      once();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps]);

  return ref;
}
