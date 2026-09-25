import { useEffect, useRef, useState } from "react";
import { SITE_SECTIONS } from "../data/site";
import { Logomark } from "../components/ui/Logo";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Faq, Layers, Paradigm, Roadmap, Settlement } from "./Sections";
import { Stage } from "./Stage";
import { Footer } from "./Footer";
import { useActiveSection, usePageProgress, useReducedMotion, useReveal } from "./hooks";
import "./site.css";

const INTRO_KEY = "cassafi:intro-seen";

/**
 * Opening: the page starts behind a black field with the keyhole mark in the
 * middle; a circle opens out from the keyhole and reveals the site. Plays once
 * per browser session, and never for reduced-motion users.
 */
function Intro() {
  const reduced = useReducedMotion();
  const [state, setState] = useState<"show" | "open" | "gone">(() => {
    try {
      return sessionStorage.getItem(INTRO_KEY) ? "gone" : "show";
    } catch {
      return "show";
    }
  });

  useEffect(() => {
    if (state === "gone") return;
    if (reduced) {
      setState("gone");
      return;
    }
    const a = window.setTimeout(() => setState("open"), 650);
    const b = window.setTimeout(() => {
      setState("gone");
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {
        /* private mode: the intro simply plays again next time */
      }
    }, 1700);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
    // runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "gone") return null;
  return (
    <div className={`pv-intro${state === "open" ? " is-open" : ""}`} aria-hidden="true">
      <Logomark inverted className="pv-intro-mark" />
    </div>
  );
}

/** Bottom-left "you are here": section number, name, and a page progress hairline. */
function Rail() {
  const active = useActiveSection(SITE_SECTIONS.map((s) => s.id));
  const progress = usePageProgress();
  const i = Math.max(0, SITE_SECTIONS.findIndex((s) => s.id === active));
  return (
    <div className="pv-rail" aria-hidden="true">
      <span className="pv-mono pv-rail-n">
        {String(i + 1).padStart(2, "0")}
        <span>/{String(SITE_SECTIONS.length).padStart(2, "0")}</span>
      </span>
      <span className="pv-rail-line">
        <i style={{ transform: `scaleY(${progress})` }} />
      </span>
      <span className="pv-mono pv-rail-name" key={active}>
        {SITE_SECTIONS[i].label}
      </span>
    </div>
  );
}

export default function SiteApp() {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  return (
    <div className="pv" ref={root}>
      <Intro />
      <Nav />
      <main>
        <Hero />
        <Paradigm />
        <Layers />
        <Settlement />
        <Stage />
        <Roadmap />
        <Faq />
      </main>
      <Footer />
      <Rail />
    </div>
  );
}
