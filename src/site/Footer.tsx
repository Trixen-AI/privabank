import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Download, Smartphone } from "lucide-react";
import { BRAND, FOOTER, SOCIALS } from "../data/site";
import { Wordmark } from "../components/ui/Logo";
import { SmartLink } from "../components/ui/SmartLink";

/**
 * Official X logo, unmodified path from X's brand toolkit
 * (https://about.x.com/content/dam/about-twitter/x/brand-toolkit/x-logo.zip, logo.svg,
 * stored byte-for-byte in src/assets/social/x.svg). The kit ships it in black and
 * white; currentColor picks whichever the footer needs.
 */
function XLogo() {
  return (
    <svg viewBox="0 0 1200 1227" width="15" height="15" aria-hidden="true">
      <path
        fill="currentColor"
        d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
      />
    </svg>
  );
}

export function Footer() {
  const [msg, setMsg] = useState("");

  const subscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    // No mailing-list backend yet: point this at your provider.
    setMsg(typeof email === "string" && email.includes("@") ? FOOTER.newsletter.success : FOOTER.newsletter.error);
    e.currentTarget.reset();
  };

  return (
    <footer className="pv-foot" id="footer">
      <div className="pv-foot-cta" data-reveal>
        <h2 className="pv-h pv-foot-h">
          {FOOTER.h2a}
          <em>{FOOTER.h2b}</em>
        </h2>
        <p>{FOOTER.sub}</p>
        <div className="pv-hero-cta">
          <Link to={FOOTER.cta.href} className="pv-btn pv-btn--ink">
            {FOOTER.cta.label} <ArrowUpRight size={15} />
          </Link>
          <a href={FOOTER.ctaSecondary.href} className="pv-btn pv-btn--line">
            {FOOTER.ctaSecondary.label}
          </a>
        </div>
      </div>

      <div className="pv-foot-grid">
        <div className="pv-foot-brand">
          <h3>{FOOTER.built}</h3>
          <p>{FOOTER.blurb}</p>
          <form className="pv-news" onSubmit={subscribe}>
            <label className="pv-mono" htmlFor="pv-email">
              {FOOTER.newsletter.label}
            </label>
            <div>
              <input id="pv-email" type="email" name="email" placeholder={FOOTER.newsletter.placeholder} autoComplete="email" required />
              <button type="submit" className="pv-btn pv-btn--ink pv-btn--sm">
                {FOOTER.newsletter.button}
              </button>
            </div>
            {msg ? (
              <p className="pv-news-msg" role="status">
                {msg}
              </p>
            ) : null}
          </form>
          <div className="pv-foot-app">
            <p>
              <span className="pv-mono">{FOOTER.app.label}</span> {FOOTER.app.body}
            </p>
            <div className="pv-stores">
              <a className="pv-store" href={FOOTER.app.android.href} download={FOOTER.app.android.filename} type="application/vnd.android.package-archive">
                <Download size={18} aria-hidden="true" />
                <span>
                  <strong>{FOOTER.app.android.label}</strong>
                  <span className="pv-mono">{FOOTER.app.android.meta}</span>
                </span>
              </a>
              <span className="pv-store pv-store--soon" aria-disabled="true">
                <Smartphone size={18} aria-hidden="true" />
                <span>
                  <strong>{FOOTER.app.ios.label}</strong>
                  <span className="pv-mono">{FOOTER.app.ios.badge}</span>
                </span>
              </span>
            </div>
          </div>
        </div>

        {FOOTER.columns.map((col) => (
          <div key={col.head} className="pv-foot-col">
            <h4 className="pv-mono">{col.head}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <SmartLink href={l.href}>{l.label}</SmartLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pv-foot-col">
          <h4 className="pv-mono">Follow</h4>
          <ul>
            {SOCIALS.map((s) => (
              <li key={s.key}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="pv-foot-social">
                  <XLogo /> {s.handle}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="pv-foot-bottom">
        <span>
          © {BRAND.year} {BRAND.legal}. All rights reserved.
        </span>
        <nav aria-label="Legal">
          {FOOTER.legal.map((l) => (
            <a key={l.label} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="pv-foot-mark" aria-hidden="true">
        <Wordmark className="pv-foot-word" />
      </div>
    </footer>
  );
}
