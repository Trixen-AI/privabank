import { useState } from "react";
import { FAQ } from "../../data/site";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="sec" id="faq" data-screen-label="FAQ">
      <div className="wrap">
        <div className="sec-head">
          <span className="ds-label">{FAQ.label}</span>
          <h2>
            {FAQ.h2a}
            <span className="hl">{FAQ.h2b}</span>
          </h2>
        </div>

        <div className="faq">
          {FAQ.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className={`faq-item${isOpen ? " open" : ""}`} key={item.q}>
                <h3>
                  <button
                    className="faq-q"
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    {item.q}
                    <i className="arr">›</i>
                  </button>
                </h3>
                <div className="faq-a" id={`faq-a-${i}`}>
                  <div className="faq-a-inner">{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
