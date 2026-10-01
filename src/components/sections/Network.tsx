import { NETWORK } from "../../data/site";
import { SmartLink } from "../ui/SmartLink";
import { useCountUp, useInView } from "../../hooks";
import { Globe } from "../viz/Globe";

export function Network() {
  const [ref, inView] = useInView<HTMLElement>("0px 0px -25% 0px");
  const heroStat = useCountUp(Number(NETWORK.heroStat.value.replace(/,/g, "")), 2000, inView);

  return (
    <section className="globe-sec" id="network" data-screen-label="Network" ref={ref}>
      <div className="wrap">
        <section className="panel panel--accent globe-panel">
          <div className="panel__glow" />
          <div className="globe-wrap">
            <Globe />
          </div>
          <div className="globe-scrim" />

          {NETWORK.cards.map((c) => (
            <div className="mxe-card show" key={c.key} style={{ left: c.left, top: c.top }}>
              <span className="mc-lbl">{c.label}</span>
              <div className="mc-key">{c.key}</div>
            </div>
          ))}

          <div className="panel__inner">
            <span className="ds-label gs-livelabel">
              <i />
              {NETWORK.liveLabel}
            </span>
            <h2>
              {NETWORK.h2a}
              <span className="hl">{NETWORK.h2b}</span>
            </h2>
            <p className="globe-desc">{NETWORK.desc}</p>
            <div className="gs-hero">
              <span className="gs-hero-num">{heroStat}</span>
              <span className="gs-hero-lbl">{NETWORK.heroStat.label}</span>
            </div>
          </div>

          <div className="gs-box">
            <div className="gs-row">
              {NETWORK.stats.map((s) => (
                <div className="gs-stat" key={s.label}>
                  <span className="gs-num">{s.value}</span>
                  <span className="gs-lbl">{s.label}</span>
                  <span className="gs-sub">{s.sub}</span>
                </div>
              ))}
            </div>
            <div className="gs-epoch">
              <div className="gs-epoch-top">
                <span>
                  Epoch <b>{NETWORK.epoch.number}</b>
                </span>
                <span>{NETWORK.epoch.remain}</span>
              </div>
              <div className="gs-epoch-bar">
                {Array.from({ length: NETWORK.epoch.total }, (_, i) => (
                  <div className={`gs-seg${i < NETWORK.epoch.filled ? " on" : ""}`} key={i} />
                ))}
              </div>
            </div>
            <SmartLink className="gs-explore" href="#layers">
              {NETWORK.explore}
              <span>›</span>
            </SmartLink>
          </div>
        </section>
      </div>
    </section>
  );
}
