import { useRef } from "react";
import { STAGE, TOKEN } from "../data/site";
import { Logomark } from "../components/ui/Logo";
import { segment, useReducedMotion, useStageProgress } from "./hooks";
import { Label } from "./Sections";

/**
 * Pinned scroll stage for $CASSA.
 *
 * Choreography (progress p of the tall wrapper, 0 → 1):
 *   0.00–0.34  each word of the headline sits under a redaction bar; the bars
 *              peel away left to right, one word after another
 *   0.30–0.40  the headline lifts and shrinks to make room
 *   0.40–0.92  four face-down cards (keyhole backs) turn face-up in sequence,
 *              each rising slightly as it turns
 * Values are derived from this layout, not borrowed from any reference.
 * On small screens the cards sit in a 2x2 grid and travel less.
 */
export function Stage() {
  const wrap = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const p = useStageProgress(wrap);
  const t = reduced ? 1 : p;

  const words = STAGE.lines.flatMap((line, li) => line.split(" ").map((w, wi) => ({ w, key: `${li}-${wi}`, br: wi === 0 && li > 0 })));
  const lift = segment(t, 0.3, 0.4);

  return (
    <section className="pv-stage-wrap" id="token" ref={wrap} aria-label={STAGE.label}>
      <div className="pv-stage" style={{ "--lift": lift } as React.CSSProperties}>
        <div className="pv-stage-head">
          <Label>{STAGE.label}</Label>
          <p className="pv-redact" aria-label={STAGE.lines.join(" ")}>
            {words.map(({ w, key, br }, i) => {
              const peel = segment(t, 0.02 + i * 0.05, 0.1 + i * 0.05);
              return (
                <span key={key} aria-hidden="true">
                  {br ? <br /> : null}
                  <span className="pv-redact-w" style={{ "--peel": peel } as React.CSSProperties}>
                    {w}
                    <span className="pv-redact-bar" />
                  </span>{" "}
                </span>
              );
            })}
          </p>
        </div>

        <div className="pv-flips">
          {TOKEN.tabs.map((tab, i) => {
            const turn = segment(t, 0.42 + i * 0.11, 0.54 + i * 0.11);
            return (
              <div key={tab.idx} className={`pv-flip pv-flip--${i}`} style={{ "--turn": turn } as React.CSSProperties}>
                <div className="pv-flip-in">
                  <div className="pv-flip-face pv-flip-back" aria-hidden="true">
                    <Logomark inverted className="pv-flip-mark" />
                    <span className="pv-mono">{tab.idx}</span>
                  </div>
                  <div className="pv-flip-face pv-flip-front" aria-hidden={turn < 0.5}>
                    <span className="pv-mono pv-flip-idx">
                      {tab.idx} · {tab.tab}
                    </span>
                    <strong className="pv-flip-fig">{tab.fig.v}</strong>
                    <span className="pv-mono pv-flip-figk">{tab.fig.k}</span>
                    <p>{tab.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="pv-stage-after" style={{ "--show": segment(t, 0.9, 1) } as React.CSSProperties}>
          {STAGE.after}
        </p>
      </div>
    </section>
  );
}
