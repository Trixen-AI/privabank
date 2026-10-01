import { COMPLIANCE } from "../../data/site";
import { SmartLink } from "../ui/SmartLink";
import { SettlementScene } from "../viz/Scenes";

export function Compliance() {
  return (
    <section className="tease-sec" id="compliance" data-screen-label="Compliance">
      <div className="wrap">
        <section className="panel bt-panel">
          <SettlementScene />
          <div className="bt-inner">
            <span className="ds-label bt-label">{COMPLIANCE.label}</span>
            <h2 className="bt-h2">
              {COMPLIANCE.h2a}
              <span className="hl">{COMPLIANCE.h2b}</span>
            </h2>
            <p className="bt-desc">{COMPLIANCE.desc}</p>

            <div className="bt-stats">
              {COMPLIANCE.stats.map((s) => (
                <div className="bt-stat" key={s.key}>
                  <span className="v">{s.value}</span>
                  <span className="k">{s.key}</span>
                  <span className="d">{s.desc}</span>
                </div>
              ))}
            </div>

            <div className="bt-cta">
              <SmartLink className="btn btn-pri" href={COMPLIANCE.cta.href}>
                {COMPLIANCE.cta.label}
              </SmartLink>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
