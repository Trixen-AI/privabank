import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, BadgeCheck, Check, Copy, EyeOff, Wifi } from "lucide-react";
import { HERO, HERO_DECK, RAILS } from "../data/site";
import { Logomark, Wordmark } from "../components/ui/Logo";
import { useReducedMotion } from "./hooks";
import robinhoodLogo from "../assets/brands/robinhood.svg";
import usdcLogo from "../assets/brands/usdc.svg";
import tetherLogo from "../assets/brands/tether.svg";

/* Official marks, unmodified. Sources are listed in README.md under "Third-party marks". */
const RAIL_LOGOS = [
  { src: robinhoodLogo, alt: "Robinhood", h: 22 },
  { src: usdcLogo, alt: "USDC", h: 24 },
  { src: tetherLogo, alt: "Tether", h: 22 },
];

const CARDS = ["card", "credential", "balance"] as const;
type CardKind = (typeof CARDS)[number];

function DeckCard({ kind }: { kind: CardKind }) {
  if (kind === "card") {
    return (
      <div className="pv-dc pv-dc--card">
        <div className="pv-dc-row">
          <span className="pv-dc-brand">
            <Logomark inverted className="pv-dc-mark" />
            <Wordmark className="pv-dc-word" />
          </span>
          <Wifi size={18} className="pv-dc-nfc" aria-hidden="true" />
        </div>
        <span className="pv-dc-chip" aria-hidden="true" />
        <div className="pv-dc-num">•••• •••• •••• {HERO_DECK.card.last4}</div>
        <div className="pv-dc-row pv-dc-foot">
          <span>
            <span className="pv-dc-k">Card holder</span>
            {HERO_DECK.card.holder}
          </span>
          <span>
            <span className="pv-dc-k">Valid thru</span>
            {HERO_DECK.card.expiry}
          </span>
        </div>
      </div>
    );
  }
  if (kind === "credential") {
    return (
      <div className="pv-dc pv-dc--cred">
        <div className="pv-dc-row">
          <span className="pv-mono">{HERO_DECK.credential.label}</span>
          <span className="pv-dc-pill">
            <BadgeCheck size={14} /> {HERO_DECK.credential.status}
          </span>
        </div>
        <div className="pv-dc-big">
          {HERO_DECK.credential.bigA}
          <br />
          <em>{HERO_DECK.credential.bigB}</em>
        </div>
        <div className="pv-dc-row pv-dc-foot">
          <span>
            <span className="pv-dc-k">Credential</span>
            <span className="pv-mono-n">{HERO_DECK.credential.id}</span>
          </span>
          <span className="pv-dc-rule">{HERO_DECK.credential.rule}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="pv-dc pv-dc--bal">
      <div className="pv-dc-row">
        <span className="pv-mono">{HERO_DECK.balance.label}</span>
        <EyeOff size={16} aria-hidden="true" />
      </div>
      <div className="pv-dc-amount">{HERO_DECK.balance.amount}</div>
      <div className="pv-dc-row pv-dc-foot">
        <span>
          <span className="pv-dc-k">{HERO_DECK.balance.publicLabel}</span>
          <span className="pv-mono-n">{HERO_DECK.balance.publicValue}</span>
        </span>
        <span className="pv-dc-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

/** Three product cards; the front one slides off the top and rejoins at the back. */
function Deck() {
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (paused || reduced) return;
    const id = window.setInterval(() => setFront((f) => (f + 1) % CARDS.length), 3400);
    return () => window.clearInterval(id);
  }, [paused, reduced]);

  return (
    <button
      type="button"
      className="pv-deck"
      aria-label="Shuffle cards"
      onClick={() => setFront((f) => (f + 1) % CARDS.length)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {CARDS.map((kind, i) => {
        const pos = (i - front + CARDS.length) % CARDS.length; // 0 = front
        return (
          <span key={kind} className="pv-deck-slot" data-pos={pos} aria-hidden={pos !== 0}>
            <DeckCard kind={kind} />
          </span>
        );
      })}
    </button>
  );
}

/** The $CASSA contract address, copyable in one tap, with a link to the explorer. */
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
    <div className="pv-ca">
      <span className="pv-ca-k pv-mono">{ca.label}</span>
      <code className="pv-ca-v" title={`${ca.address} on ${ca.chain}`}>
        <span className="pv-ca-full">{ca.address}</span>
        <span className="pv-ca-short" aria-hidden="true">
          {ca.address.slice(0, 6)}…{ca.address.slice(-4)}
        </span>
      </code>
      <button type="button" className="pv-ca-btn" onClick={copy} aria-label={copied ? "Contract address copied" : "Copy contract address"}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <a
        className="pv-ca-btn"
        href={ca.explorer}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View $CASSA on the ${ca.chain} explorer`}
      >
        <ArrowUpRight size={15} />
      </a>
      <span className="pv-ca-live" role="status">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}

export function Hero() {
  return (
    <header className="pv-hero" id="top">
      <div className="pv-hero-glow" aria-hidden="true" />
      <div className="pv-hero-grid" aria-hidden="true" />

      <a className="pv-hero-news" href={HERO.pill.href}>
        <span className="pv-dot" />
        <span className="pv-mono">{HERO.pill.flag}</span>
        {HERO.pill.text}
        <ArrowUpRight size={14} />
      </a>

      <div className="pv-hero-stage">
        <h1 className="pv-hero-h1">
          <span className="pv-hero-a">{HERO.h1a}</span>
          <Deck />
          <span className="pv-hero-b">
            <em>{HERO.h1b}</em>
          </span>
        </h1>
      </div>

      <div className="pv-hero-foot">
        <div className="pv-hero-copy">
          <p>{HERO.sub}</p>
          <div className="pv-hero-cta">
            <Link to={HERO.ctaPrimary.href} className="pv-btn pv-btn--jade">
              {HERO.ctaPrimary.label} <ArrowUpRight size={15} />
            </Link>
            <a href={HERO.ctaSecondary.href} className="pv-btn pv-btn--ghost">
              {HERO.ctaSecondary.label}
            </a>
          </div>
          <ContractAddress />
        </div>
        <p className="pv-hero-hint pv-mono">{HERO_DECK.hint}</p>
      </div>

      <dl className="pv-spec">
        {HERO.spec.map((s) => (
          <div key={s.k}>
            <dt className="pv-mono">{s.k}</dt>
            <dd>
              {s.k === "Status" ? <span className="pv-dot pv-dot--live" /> : null}
              {s.v}
            </dd>
          </div>
        ))}
      </dl>

      <div className="pv-rails">
        <span className="pv-mono pv-rails-cap">{RAILS.cap}</span>
        <div className="pv-marquee">
          <div className="pv-marquee-track">
            {[0, 1, 2, 3].map((dup) =>
              RAIL_LOGOS.map((l) => (
                <img key={`${dup}-${l.alt}`} src={l.src} alt={dup === 0 ? l.alt : ""} style={{ height: l.h }} />
              )),
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
