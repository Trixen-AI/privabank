import { Fragment, useEffect, useState } from "react";
import { SmartLink } from "../ui/SmartLink";
import { LAYERS } from "../../data/site";
import { usePrefersReducedMotion } from "../../hooks";
import { Icon } from "../ui/Icon";

const AUTOPLAY_MS = 9000;
const WORD_STAGGER_MS = 55;
const META_DELAY_MS = 1685;

export function Layers() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!playing || reduced) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % LAYERS.items.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing, reduced]);

  const item = LAYERS.items[active];
  const words = item.quote.split(" ");
  const metaDelay = reduced ? 0 : Math.min(META_DELAY_MS, words.length * WORD_STAGGER_MS + 250);

  return (
    <section className="companies" id="layers" data-screen-label="Layers">
      <div className="wrap">
        <div className="companies-head">
          <h2>
            {LAYERS.h2a}
            <span className="hl">{LAYERS.h2b}</span>
          </h2>
          <p>{LAYERS.lead}</p>
          <SmartLink className="btn btn-sec companies-cta" href={LAYERS.cta.href}>
            {LAYERS.cta.label}
            <i className="ic-chev">›</i>
          </SmartLink>
        </div>

        <div className="panel panel--invert comp-panel">
          <div className="panel__inner">
            <div className="comp-tabs" role="tablist" aria-label="Protocol layers">
              {LAYERS.items.map((l, i) => (
                <button
                  key={l.id}
                  className={`comp-tab${i === active ? " active" : ""}`}
                  role="tab"
                  type="button"
                  aria-selected={i === active}
                  onClick={() => {
                    setActive(i);
                    setPlaying(false);
                  }}
                >
                  <span className="comp-logo">
                    <Icon name={l.icon} />
                  </span>
                  {l.tab}
                </button>
              ))}
            </div>

            <div className="comp-body">
              <button
                className="comp-playpause"
                type="button"
                aria-label={playing ? "Pause autoplay" : "Resume autoplay"}
                onClick={() => setPlaying((v) => !v)}
              >
                <Icon name={playing ? "pause" : "play"} />
              </button>

              <div className="comp-quote-row">
                <div className="comp-quote">
                  <blockquote key={item.id}>
                    {/* The space sits between the spans, not inside them: trailing
                        whitespace inside an inline-block collapses away. */}
                    {words.map((w, i) => (
                      <Fragment key={`${item.id}-${i}`}>
                        <span
                          className="comp-word"
                          style={{ animationDelay: reduced ? "0ms" : `${i * WORD_STAGGER_MS}ms` }}
                        >
                          {w}
                        </span>{" "}
                      </Fragment>
                    ))}
                  </blockquote>
                  <div
                    className="cite comp-fade"
                    key={`${item.id}-cite`}
                    style={{ animationDelay: `${metaDelay}ms`, animationFillMode: "both" }}
                  >
                    <b>{item.cite}</b>
                  </div>
                  <div
                    className="comp-tags comp-fade"
                    key={`${item.id}-tags`}
                    style={{ animationDelay: `${metaDelay}ms`, animationFillMode: "both" }}
                  >
                    {item.tags.map((t) => (
                      <span className="comp-tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className="comp-bigmark comp-fade"
                  key={`${item.id}-mark`}
                  style={{ animationDelay: `${metaDelay}ms`, animationFillMode: "both" }}
                >
                  <Icon name={item.icon} size={150} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
