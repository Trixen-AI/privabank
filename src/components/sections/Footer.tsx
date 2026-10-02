import { useState, type FormEvent } from "react";
import { SmartLink } from "../ui/SmartLink";
import { BRAND, FOOTER, SOCIALS } from "../../data/site";
import { Logomark, Wordmark } from "../ui/Logo";


/**
 * Official X logo, unmodified path from X's brand toolkit
 * (https://about.x.com/content/dam/about-twitter/x/brand-toolkit/x-logo.zip, logo.svg,
 * stored byte-for-byte in src/assets/social/x.svg). The kit ships it in black and
 * white; currentColor picks whichever the footer needs.
 */
function XLogo() {
  return (
    <svg viewBox="0 0 1200 1227" aria-hidden="true">
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
    // No mailing-list backend is wired up yet: point this at your provider.
    setMsg(typeof email === "string" && email.includes("@") ? FOOTER.newsletter.success : FOOTER.newsletter.error);
    e.currentTarget.reset();
  };

  return (
    <footer className="footer" id="footer" data-screen-label="Footer">
      <div className="footer-dots" />

      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="lock">
              <Logomark inverted />
              <Wordmark />
            </div>
            <p>{FOOTER.blurb}</p>

            <div className="footer-news">
              <span className="footer-news-label">{FOOTER.newsletter.label}</span>
              <form className="footer-news-form" onSubmit={subscribe}>
                <label className="visually-hidden" htmlFor="footer-email">
                  Email address
                </label>
                <input
                  className="footer-news-input"
                  id="footer-email"
                  type="email"
                  name="email"
                  placeholder={FOOTER.newsletter.placeholder}
                  autoComplete="email"
                  required
                />
                <button className="btn btn-pri" type="submit">
                  {FOOTER.newsletter.button}
                </button>
              </form>
              {msg && (
                <p className="footer-news-msg" role="status">
                  {msg}
                </p>
              )}
            </div>

            <div className="footer-app">
              <span className="footer-news-label">{FOOTER.app.label}</span>
              <p>{FOOTER.app.body}</p>
              <span className="soon">{FOOTER.app.badge}</span>
            </div>
          </div>

          {FOOTER.columns.map((col) => (
            <div className="footer-col" key={col.head}>
              <h4>{col.head}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <SmartLink href={l.href}>{l.label}</SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-col">
            <h4>Follow Spectral</h4>
            <div className="socials">
              {SOCIALS.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  <XLogo />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {BRAND.year} {BRAND.legal}. All rights reserved.
        </span>
        <nav className="footer-legal" aria-label="Legal">
          {FOOTER.legal.map((l) => (
            <SmartLink href={l.href} key={l.label}>
              {l.label}
            </SmartLink>
          ))}
        </nav>
      </div>

      <div className="footer-wordmark" aria-hidden="true">
        <Wordmark className="" />
      </div>
    </footer>
  );
}
