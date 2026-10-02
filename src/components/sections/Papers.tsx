import { PAPERS } from "../../data/site";
import { SmartLink } from "../ui/SmartLink";
import { DotField, PaperMarkSpectral, PaperMarkWarden } from "../ui/Art";

const MARKS = [PaperMarkSpectral, PaperMarkWarden];

export function Papers() {
  return (
    <section className="research" id="papers" data-screen-label="Papers">
      <div className="wrap">
        <div className="rr-head">
          <span className="ds-label">{PAPERS.label}</span>
          <h2>{PAPERS.h2}</h2>
          <p className="lead">{PAPERS.lead}</p>
        </div>

        <div className="rr-grid">
          {PAPERS.items.map((p, i) => {
            const Mark = MARKS[i % MARKS.length];
            return (
              <SmartLink className="paper" href="#papers" key={p.name}>
                <div className={`paper-cover${p.variant === "dark" ? " paper-cover--dark" : ""}`}>
                  <DotField />
                  <Mark />
                  <div className="paper-stack">
                    <span className="ps-name">{p.name}</span>
                    <span className="ps-rest">{p.sub}</span>
                  </div>
                </div>
                <div className="paper-body">
                  <p className="paper-rest">{p.rest}</p>
                  <div className="paper-meta">
                    <span>{p.date}</span>
                  </div>
                </div>
              </SmartLink>
            );
          })}
        </div>

        <div className="rr-cta">
          <SmartLink className="btn btn-pri" href={PAPERS.cta.href}>
            {PAPERS.cta.label} <i className="ic-chev">›</i>
          </SmartLink>
        </div>
      </div>
    </section>
  );
}
