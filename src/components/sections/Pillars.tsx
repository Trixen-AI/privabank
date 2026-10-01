import { PILLARS } from "../../data/site";
import { Icon } from "../ui/Icon";

export function Pillars() {
  return (
    <section className="howit" id="pillars" data-screen-label="Pillars">
      <div className="wrap">
        <span className="ds-label">{PILLARS.label}</span>
        <h2>
          {PILLARS.h2a}
          <span className="hl">{PILLARS.h2b}</span>
        </h2>
        <p className="howit-lead">{PILLARS.lead}</p>

        <div className="pillars">
          {PILLARS.items.map((p) => (
            <article className="pillar" key={p.title}>
              <div className="pillar-ico">
                <Icon name={p.icon} />
              </div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
