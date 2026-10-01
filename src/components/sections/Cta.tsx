import { CTA } from "../../data/site";
import { SmartLink } from "../ui/SmartLink";
import { Icon } from "../ui/Icon";
import { PhoneMock } from "../ui/Art";

/** Resting positions for the drifting glass tiles: three on each side, tilted,
 *  then animated by the drift1..drift6 loops. `--rot` is the resting angle each
 *  keyframe rotates around, so the tiles never snap back to level. */
type TileStyle = React.CSSProperties & { "--rot": string };

// Pinned in px from the top so they stay beside the heading however tall the
// cards below grow.
const TILE_POS: TileStyle[] = [
  { top: "150px", left: "7%", "--rot": "-12deg" },
  { top: "272px", left: "3%", "--rot": "8deg" },
  { top: "74px", left: "19%", "--rot": "-9deg" },
  { top: "140px", right: "8%", "--rot": "13deg" },
  { top: "268px", right: "3%", "--rot": "-7deg" },
  { top: "70px", right: "19%", "--rot": "10deg" },
];

function BoxVisual({ kind }: { kind: "phone" | "code" | "relayer" }) {
  if (kind === "phone") {
    return (
      <div className="cta-phone">
        <PhoneMock label={CTA.phone.label} amount={CTA.phone.amount} />
      </div>
    );
  }
  if (kind === "code") {
    return (
      <pre className="cta-code" aria-label="SDK example">
        <code>{CTA.code.join("\n")}</code>
      </pre>
    );
  }
  return (
    <dl className="cta-relayer">
      {CTA.relayer.map((r) => (
        <div key={r.k}>
          <dt>{r.k}</dt>
          <dd>{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Cta() {
  return (
    <section className="cta" id="build" data-screen-label="CTA">
      <div className="wrap">
        <section className="panel panel--accent cta-panel">
          <div className="cta-grid" />
          <div className="cta-spot" />
          <div className="cta-tiles" aria-hidden="true">
            {CTA.tiles.map((icon, i) => (
              <div className="cta-tile" key={icon} style={TILE_POS[i]}>
                <Icon name={icon} />
              </div>
            ))}
          </div>
          <div className="panel__glow" />

          <div className="panel__inner">
            <h2>
              {CTA.h2a}
              <span className="hl">{CTA.h2b}</span>
            </h2>
            <p className="sub">{CTA.sub}</p>

            <div className="cta-cats">
              {CTA.boxes.map((box) => (
                <div className="cta-catbox" key={box.title}>
                  <span className="cta-cat-label">{box.label}</span>
                  <h3>{box.title}</h3>
                  <p>{box.body}</p>
                  <BoxVisual kind={box.visual} />
                  <div className="cta-btns">
                    {box.buttons.map((b) =>
                      b.soon ? (
                        <button className="btn btn-glass btn-soon" type="button" aria-disabled="true" key={b.label}>
                          <span>{b.label}</span>
                          <span className="soon-badge">Soon</span>
                        </button>
                      ) : (
                        <SmartLink className={`btn ${b.primary ? "btn-pri" : "btn-glass"}`} href={b.href} key={b.label}>
                          {b.label}
                        </SmartLink>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cta-strip">
            <div className="cta-strip-track">
              {[0, 1].map((dup) =>
                CTA.features.map((f) => (
                  <div className="cta-feat" key={`${dup}-${f.text}`}>
                    <Icon name={f.icon} size={17} />
                    {f.text}
                  </div>
                )),
              )}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
