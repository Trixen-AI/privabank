import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Fingerprint, Layers as LayersIcon, Minus, Plus, WandSparkles } from "lucide-react";
import { FAQ, LAYERS, PARADIGM, PILLARS, ROADMAP, SETTLEMENT } from "../data/site";
import { GlassHouseArt, NeobankArt, PoolArt } from "./Art";
import { useReducedMotion } from "./hooks";

/** Mono section label with the jade status dot. */
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="pv-label pv-mono">
      <span className="pv-dot" />
      {children}
    </span>
  );
}

/** Headline with the signature treatment: plain sans, then an italic serif phrase in jade. */
export function Headline({ a, b, as: Tag = "h2", className = "" }: { a: string; b: string; as?: "h1" | "h2"; className?: string }) {
  return (
    <Tag className={`pv-h ${className}`}>
      {a}
      <em>{b}</em>
    </Tag>
  );
}

/* ------------------------------------------------------------------ the shift */

const PILLAR_ICONS = [Fingerprint, LayersIcon, WandSparkles];

export function Paradigm() {
  const arts = [<GlassHouseArt key="a" />, <PoolArt key="b" />, <NeobankArt key="c" />];
  const tiles = PARADIGM.tiles.map((t, i) => ({ ...t, art: arts[i], tone: i === 0 ? "was" : "now" }));
  return (
    <section className="pv-sec pv-shift" id="paradigm">
      <div className="pv-head" data-reveal>
        <Label>{PARADIGM.label}</Label>
        <Headline a={PARADIGM.h2a} b={PARADIGM.h2b} />
        <p className="pv-lead">{PARADIGM.lead}</p>
      </div>

      <div className="pv-tiles">
        {tiles.map((t, i) => (
          <article key={t.title} className={`pv-tile pv-tile--${t.tone}`} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
            <div className="pv-tile-art">{t.art}</div>
            <span className="pv-tile-tag pv-mono">{t.tag}</span>
            <h3>{t.title}</h3>
            <p>{t.body}</p>
          </article>
        ))}
      </div>

      <div className="pv-why">
        <div data-reveal>
          <Label>{PILLARS.label}</Label>
          <p className="pv-why-intro">
            {PILLARS.h2a}
            <em>{PILLARS.h2b}</em>
          </p>
        </div>
        {PILLARS.items.map((p, i) => {
          const Icon = PILLAR_ICONS[i];
          return (
            <div key={p.title} className="pv-why-item" data-reveal style={{ "--d": `${(i + 1) * 80}ms` } as React.CSSProperties}>
              <Icon size={18} className="pv-why-ico" />
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ how it works */

const TRACE = LAYERS.trace.lines;

/** A live trace of one authorization, typed line by line when it scrolls in. */
function Trace() {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (reduced) return setN(TRACE.length);
      let i = 0;
      const step = () => {
        i += 1;
        setN(i);
        if (i < TRACE.length) timer = window.setTimeout(step, 420);
      };
      timer = window.setTimeout(step, 300);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [reduced]);

  return (
    <div className="pv-trace" ref={ref}>
      <div className="pv-trace-head">
        <span className="pv-mono">{LAYERS.trace.title}</span>
        <span className={`pv-trace-state pv-mono${n >= TRACE.length ? " is-done" : ""}`}>
          {n >= TRACE.length ? LAYERS.trace.done : LAYERS.trace.running}
        </span>
      </div>
      <ol>
        {TRACE.slice(0, n).map(([t, k, v]) => (
          <li key={t}>
            <span className="pv-mono-n">{t}s</span>
            <span className="pv-trace-k pv-mono">{k}</span>
            <span>{v}</span>
          </li>
        ))}
        {n < TRACE.length ? <li className="pv-trace-caret" aria-hidden="true" /> : null}
      </ol>
    </div>
  );
}

export function Layers() {
  return (
    <section className="pv-sec pv-how" id="layers">
      <div className="pv-head" data-reveal>
        <Label>{LAYERS.label}</Label>
        <Headline a={LAYERS.h2a} b={LAYERS.h2b} />
        <p className="pv-lead">{LAYERS.lead}</p>
      </div>

      <div className="pv-how-grid">
        <ol className="pv-steps">
          {LAYERS.items.map((l, i) => (
            <li key={l.id} data-reveal style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
              <span className="pv-step-n pv-mono">0{i + 1}</span>
              <div>
                <h3>
                  {l.tab}
                  {l.tags.map((t) => (
                    <span key={t} className="pv-chip pv-mono">
                      {t}
                    </span>
                  ))}
                </h3>
                <p>{l.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="pv-how-side" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
          <Trace />
          <p className="pv-how-note">{LAYERS.note}</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ settlement */

export function Settlement() {
  return (
    <section className="pv-sec pv-settle" id="settlement">
      <div className="pv-head" data-reveal>
        <Label>{SETTLEMENT.label}</Label>
        <Headline a={SETTLEMENT.h2a} b={SETTLEMENT.h2b} />
        <p className="pv-lead">{SETTLEMENT.lead}</p>
      </div>

      <div className="pv-panel" data-reveal>
        <div className="pv-panel-top">
          <Label>{SETTLEMENT.panelLabel}</Label>
          <span className="pv-mono pv-panel-note">{SETTLEMENT.panelNote}</span>
        </div>
        <div className="pv-big">
          <strong>{SETTLEMENT.big}</strong>
          <span>{SETTLEMENT.bigUnit}</span>
        </div>
        <div className="pv-bars">
          {SETTLEMENT.bars.map((b) => (
            <div key={b.k} className="pv-bar-row">
              <div className="pv-bar-lab">
                <span className="pv-mono">{b.k}</span>
                <span className="pv-mono-n">{b.v}</span>
              </div>
              <div className="pv-bar">
                <span style={{ "--fill": b.fill } as React.CSSProperties} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pv-cols">
        {SETTLEMENT.stats.map((s, i) => (
          <div key={s.key} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
            <span className="pv-cols-v">{s.value}</span>
            <h3>{s.key}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ roadmap (light band) */

export function Roadmap() {
  const done = ROADMAP.steps.filter((s) => s.done).length;
  return (
    <section className="pv-light" id="roadmap">
      <div className="pv-light-inner">
        <div className="pv-head" data-reveal>
          <Label>{ROADMAP.label}</Label>
          <Headline a={ROADMAP.h2a} b={ROADMAP.h2b} />
          <p className="pv-lead">{ROADMAP.lead}</p>
        </div>
        <ol className="pv-road" style={{ "--done": done / ROADMAP.steps.length } as React.CSSProperties} data-reveal>
          {ROADMAP.steps.map((s) => (
            <li key={s.k} className={s.done ? "is-done" : ""}>
              <span className="pv-road-node" aria-hidden="true" />
              <span className="pv-mono">{s.k}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <span className="pv-road-state pv-mono">{s.done ? "Shipped" : "Next"}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ FAQ */

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="pv-sec pv-faq" id="faq">
      <div className="pv-faq-side" data-reveal>
        <Label>{FAQ.label}</Label>
        <Headline a={FAQ.h2a} b={FAQ.h2b} />
        <Link to="/app" className="pv-btn pv-btn--ghost">
          {FAQ.cta} <ArrowUpRight size={15} />
        </Link>
      </div>
      <div className="pv-faq-list">
        {FAQ.items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.q} className={`pv-qa${isOpen ? " is-open" : ""}`}>
              <h3>
                <button type="button" aria-expanded={isOpen} aria-controls={`pv-qa-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                  <span className="pv-mono pv-qa-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pv-qa-q">{it.q}</span>
                  {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                </button>
              </h3>
              <div className="pv-qa-a" id={`pv-qa-${i}`}>
                <div>
                  <p>{it.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
