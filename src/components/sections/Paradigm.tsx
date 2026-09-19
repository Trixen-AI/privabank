import { PARADIGM } from "../../data/site";
import { SmartLink } from "../ui/SmartLink";
import { useCountUp, useInView } from "../../hooks";
import { PoolScene } from "../viz/Scenes";
import { NeobankArt } from "../ui/Art";

export function Paradigm() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const count = useCountUp(Number(PARADIGM.cards.problem.counter.value.replace(/,/g, "")), 1800, inView);

  return (
    <section className="intro" id="paradigm" data-screen-label="Paradigm">
      <div className="wrap">
        <span className="ds-label">{PARADIGM.label}</span>
        <h2>
          {PARADIGM.h2a}
          <span className="hl">{PARADIGM.h2b}</span>
        </h2>
        <p>{PARADIGM.lead}</p>

        <div className="intro-cards" ref={ref}>
          <SmartLink className="intro-card intro-card--glass" href="#network">
            <h3>{PARADIGM.cards.problem.title}</h3>
            <p>{PARADIGM.cards.problem.body}</p>
            <div className="bc-live">
              <div className="bc-count">
                <span className="bc-num">{count}</span>
                <span className="bc-cap">{PARADIGM.cards.problem.counter.caption}</span>
              </div>
              <div className="bc-band">
                <div className="bc-track">
                  {[0, 1].map((dup) =>
                    PARADIGM.cards.problem.chips.map((c) => (
                      <span className="bc-chip" key={`${dup}-${c}`}>
                        {c}
                      </span>
                    )),
                  )}
                </div>
              </div>
            </div>
            <span className="ic-link">
              {PARADIGM.cards.problem.link} <i className="ic-chev">›</i>
            </span>
          </SmartLink>

          <SmartLink className="intro-card intro-card--dark" href="#network">
            <PoolScene />
            <h3>{PARADIGM.cards.vault.title}</h3>
            <p>{PARADIGM.cards.vault.body}</p>
            <span className="ic-link">
              {PARADIGM.cards.vault.link} <i className="ic-chev">›</i>
            </span>
          </SmartLink>

          <SmartLink className="intro-card intro-card--wide" href="/app">
            <span className="icw-tx">
              <h3>{PARADIGM.cards.bank.title}</h3>
              <p>{PARADIGM.cards.bank.body}</p>
              <span className="ic-link">
                {PARADIGM.cards.bank.link} <i className="ic-chev">›</i>
              </span>
            </span>
            <span className="icw-art">
              <NeobankArt />
            </span>
          </SmartLink>
        </div>
      </div>
    </section>
  );
}
