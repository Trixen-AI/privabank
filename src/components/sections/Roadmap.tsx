import { ROADMAP } from "../../data/site";
import { SmartLink } from "../ui/SmartLink";

export function Roadmap() {
  return (
    <section className="howit" id="roadmap" data-screen-label="Roadmap">
      <div className="wrap">
        <span className="ds-label">{ROADMAP.label}</span>
        <h2>
          {ROADMAP.h2a}
          <span className="hl">{ROADMAP.h2b}</span>
        </h2>
        <p className="howit-lead">{ROADMAP.lead}</p>

        <ol className="road">
          {ROADMAP.steps.map((s) => (
            <li className={`road-step${s.done ? " is-done" : ""}`} key={s.k}>
              <span className="k">{s.k}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="road-cta">
          <SmartLink className="btn btn-sec" href={ROADMAP.cta.href}>
            {ROADMAP.cta.label}
          </SmartLink>
        </div>
      </div>
    </section>
  );
}
