import { useState } from "react";
import { TOKEN } from "../../data/site";
import { DotMatrixPanel } from "../viz/Scenes";
import { Icon } from "../ui/Icon";

export function Token() {
  const [active, setActive] = useState(0);

  return (
    <section className="token" id="token" data-screen-label="Token">
      <div className="wrap">
        <section className="panel panel--accent token-panel">
          <DotMatrixPanel />
          <div className="panel__inner">
            <div className="token-head">
              <span className="ds-label">{TOKEN.label}</span>
              <h2>
                {TOKEN.h2a}
                <span className="hl">{TOKEN.h2b}</span>
              </h2>
              <p className="lead">{TOKEN.lead}</p>
              <div className="token-head-btns">
                {TOKEN.buttons.map((b) => (
                  <a
                    className={`btn ${b.primary ? "btn-pri" : "btn-glass"} token-head-btn`}
                    href={b.href}
                    key={b.label}
                  >
                    <Icon name={b.icon} size={17} />
                    {b.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="token-nav">
              <div className="token-tabs" role="tablist" aria-label="$SPECTRAL utility">
                {TOKEN.tabs.map((t, i) => (
                  <button
                    key={t.idx}
                    className={`token-tab${i === active ? " active" : ""}`}
                    role="tab"
                    type="button"
                    aria-selected={i === active}
                    onClick={() => setActive(i)}
                  >
                    <span className="tb-idx">{t.idx}</span>
                    {t.tab}
                  </button>
                ))}
              </div>

              <div className="token-body">
                {TOKEN.tabs.map((t, i) => (
                  <div className={`token-text${i === active ? " active" : ""}`} role="tabpanel" key={t.idx}>
                    <h3>{t.title}</h3>
                    <p>{t.body}</p>
                    <div className="token-figs">
                      {t.figs.map((f) => (
                        <div className="token-fig" key={f.k}>
                          <span className="v">{f.v}</span>
                          <span className="k">{f.k}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
