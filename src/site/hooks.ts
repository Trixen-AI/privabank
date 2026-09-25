import { useEffect, useRef, useState, type RefObject } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * Adds `is-in` to every [data-reveal] element under `root` the first time it
 * enters the viewport. CSS does the motion (rise + fade, staggered through
 * --d), so reduced-motion users get the final state with no transition.
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = [...el.querySelectorAll<HTMLElement>("[data-reveal]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [root]);
}

/**
 * 0 → 1 progress through a tall section, measured on the static outer wrapper
 * (never on the element being transformed, which would feed back into itself).
 * 0 when the wrapper's top reaches the viewport top, 1 when its bottom reaches
 * the viewport bottom: exactly the span the sticky stage is pinned for.
 */
export function useStageProgress(wrapper: RefObject<HTMLElement | null>) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const next = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setP((prev) => (Math.abs(prev - next) > 0.001 ? next : prev));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [wrapper]);
  return p;
}

/** Which of the given section ids is currently under the middle of the viewport. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // ids is a constant list from site data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return active;
}

/** Page scroll 0 → 1, for the rail's progress line. */
export function usePageProgress() {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const read = () => {
      raf.current = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
    };
    const on = () => {
      if (!raf.current) raf.current = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf.current);
    };
  }, []);
  return p;
}

/** Clamp a sub-range of progress to its own 0 → 1. */
export const segment = (p: number, from: number, to: number) => Math.min(1, Math.max(0, (p - from) / (to - from)));
