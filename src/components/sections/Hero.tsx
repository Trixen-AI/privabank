import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { HERO, RAILS } from "../../data/site";
import { SmartLink } from "../ui/SmartLink";
import { useRotatingWord } from "../../hooks";
import solanaLogo from "../../assets/brands/solana.svg";
import usdcLogo from "../../assets/brands/usdc.svg";
import tetherLogo from "../../assets/brands/tether.svg";

/**
 * Third-party marks, official SVG files, used unmodified and only to name the
 * networks and assets Spectral settles on. Sources:
 *   Solana  https://solana.com/branding -> /src/img/branding/solanaLogo.svg
 *   USDC    https://www.circle.com/pressroom (brand kit) -> Lockup/USDC Lockup.svg
 *   Tether  https://tether.to/en/media/ -> /images/logoGreen.svg
 * On the dark site USDC and Tether render as their reversed one-colour (white)
 * variants; Solana's file is already its dark-background version (gradient mark,
 * white wordmark) and is shown as is. See .logo-cell img in components.css.
 */
const RAIL_LOGOS = [
  { src: solanaLogo, alt: "Solana", height: 20, asIs: true },
  { src: usdcLogo, alt: "USDC", height: 24 },
  { src: tetherLogo, alt: "Tether", height: 22 },
];

/** The $SPECTRAL contract address, copyable in one tap, with a link to Solscan. */
function ContractAddress() {
  const [copied, setCopied] = useState(false);
  const { ca } = HERO;

  async function copy() {
    try {
      await navigator.clipboard.writeText(ca.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: the address is still selectable text.
    }
  }

  return (
    <div className="hero-ca">
      <span className="hero-ca-k">{ca.label}</span>
      <code className="hero-ca-v" title={`${ca.address} on ${ca.chain}`}>
        <span className="hero-ca-full">{ca.address}</span>
        <span className="hero-ca-short" aria-hidden="true">
          {ca.address.slice(0, 6)}…{ca.address.slice(-6)}
        </span>
      </code>
      <button type="button" className="hero-ca-btn" onClick={copy} aria-label={copied ? "Contract address copied" : "Copy contract address"}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <a className="hero-ca-btn" href={ca.explorer} target="_blank" rel="noopener noreferrer" aria-label={`View $SPECTRAL on Solscan`}>
        <ArrowUpRight size={15} />
      </a>
      <span className="hero-ca-live" role="status">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}

export function Hero() {
  const { word, phase } = useRotatingWord(HERO.labelWords);

  return (
    <header className="hero" id="top" data-screen-label="Hero">
      <div className="wrap">
        <section className="panel panel--accent hero-panel">
          <div className="panel__dots" />
          <div className="panel__glow" />
          <div className="panel__inner">
            <SmartLink className="hero-news" href={HERO.pill.href}>
              <span className="hn-live">
                <i />
                {HERO.pill.flag}
              </span>
              <span className="hn-text">{HERO.pill.text}</span>
              <i className="arr">›</i>
            </SmartLink>

            <span className="ds-label">
              {HERO.labelPrefix}{" "}
              <span className="rotw">
                <span className={`rotw-w ${phase}`} key={word}>
                  {word}
                </span>
              </span>{" "}
              {HERO.labelSuffix}
            </span>

            <h1>
              {HERO.h1a}
              <span className="hl">{HERO.h1b}</span>
            </h1>

            <p className="sub">{HERO.sub}</p>

            <div className="hero-cta">
              <SmartLink className="btn btn-pri" href={HERO.ctaPrimary.href}>
                {HERO.ctaPrimary.label}
              </SmartLink>
              <SmartLink className="btn btn-glass" href={HERO.ctaSecondary.href}>
                {HERO.ctaSecondary.label}
              </SmartLink>
            </div>

            <ContractAddress />

            <p className="hero-note">
              {HERO.note} <SmartLink href={HERO.noteLink.href}>{HERO.noteLink.label}</SmartLink>
            </p>

            <div className="hero-spec">
              {HERO.spec.map((s) => (
                <div key={s.k}>
                  <span className="k">{s.k}</span>
                  <span className="v">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="trusted">
        <div className="wrap">
          <div className="cap">{RAILS.cap}</div>
          <div className="marquee">
            <div className="marquee-track">
              {[0, 1].map((dup) =>
                RAIL_LOGOS.map((logo) => (
                  <div className="logo-cell" key={`${dup}-${logo.alt}`}>
                    <img src={logo.src} alt={logo.alt} className={"asIs" in logo ? "is-original" : undefined} style={{ height: logo.height }} />
                  </div>
                )),
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
