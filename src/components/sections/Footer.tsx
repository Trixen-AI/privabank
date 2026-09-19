import { useState, type FormEvent } from "react";
import { SmartLink } from "../ui/SmartLink";
import { BRAND, FOOTER, SOCIALS } from "../../data/site";
import { Logomark, Wordmark } from "../ui/Logo";


/**
 * X publishes no freely downloadable official SVG (its brand toolkit is gated),
 * and the rule is never to redraw a brand mark from memory. Until the file is
 * supplied, the X link carries a neutral bordered mark with the platform letter,
 * not a reproduction of the X logo.
 */
function NeutralMark({ letter }: { letter: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text
        x="12"
        y="16.4"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="inherit"
        fontSize="11"
        fontWeight="600"
      >
        {letter}
      </text>
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
            <h4>Follow PrivaBank</h4>
            <div className="socials">
              {SOCIALS.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                  <NeutralMark letter="X" />
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
