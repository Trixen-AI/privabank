import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { SITE_NAV } from "../data/site";
import { Logo } from "../components/ui/Logo";

/**
 * Floating navigation: the lockup on the left, a dark glass capsule of section
 * links, and the app entry as a jade pill. On small screens the capsule folds
 * into a full-screen menu.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [light, setLight] = useState(false);

  useEffect(() => {
    // Light sections under the header band switch it to its light variant.
    const lights = ["roadmap", "footer"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    let raf = 0;
    const read = () => {
      raf = 0;
      setScrolled(window.scrollY > 24);
      setLight(lights.some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= 40 && r.bottom >= 40;
      }));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className={`pv-nav${scrolled ? " is-scrolled" : ""}${light ? " is-light" : ""}`}>
        <a className="brand pv-nav-brand" href="#top" aria-label="CassaFi home">
          <Logo />
        </a>

        <nav className="pv-capsule" aria-label="Sections">
          {SITE_NAV.map((l) => (
            <a key={l.href} href={l.href} className="pv-capsule-link">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="pv-nav-actions">
          <Link to="/app" className="pv-nav-login">
            Log in
          </Link>
          <Link to="/app" className="pv-btn pv-btn--jade pv-btn--sm">
            Sign up <ArrowUpRight size={14} />
          </Link>
          <button
            type="button"
            className="pv-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <div className={`pv-sheet${open ? " is-open" : ""}`} aria-hidden={!open}>
        <nav aria-label="Menu" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {SITE_NAV.map((l, i) => (
            <a key={l.href} href={l.href} tabIndex={open ? 0 : -1} style={{ "--d": `${i * 40}ms` } as React.CSSProperties}>
              <span className="pv-mono">{String(i + 1).padStart(2, "0")}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="pv-sheet-cta">
          <Link to="/app" className="pv-btn pv-btn--ghost" tabIndex={open ? 0 : -1}>
            Log in
          </Link>
          <Link to="/app" className="pv-btn pv-btn--jade" tabIndex={open ? 0 : -1}>
            Sign up <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </>
  );
}
