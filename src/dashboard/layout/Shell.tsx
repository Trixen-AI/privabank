import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useAppKit } from "@reown/appkit/react";
import { ArrowUpRight, ChevronDown, Menu, Settings, X } from "lucide-react";
import { Logo } from "../../components/ui/Logo";
import { useWallet } from "../hooks/data";
import { chainMeta } from "../lib/chains";
import { shortAddr } from "../lib/format";
import { useWalletData } from "../lib/store";

/* The app wears the website's chrome: the lockup on the left, a dark glass
   capsule of destinations in the middle, account controls on the right, a
   full-screen numbered menu on small screens, and the vertical "you are here"
   rail in the left margin. */

const NAV: { to: string; label: string; long: string; end?: boolean }[] = [
  { to: "/app", label: "Overview", long: "Overview", end: true },
  { to: "/app/pay", label: "Pay", long: "Authorize a payment" },
  { to: "/app/activity", label: "Activity", long: "Activity" },
  { to: "/app/credential", label: "Card", long: "Card & credential" },
  { to: "/app/privacy", label: "Exposure", long: "Exposure report" },
  { to: "/app/controls", label: "Controls", long: "Spending controls" },
  { to: "/app/settings", label: "Settings", long: "Settings" },
];

// The capsule leaves Settings to its own icon button; the menu and the rail list everything.
const CAPSULE = NAV.slice(0, -1);

function useScrolled(offset = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const read = () => setScrolled(window.scrollY > offset);
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [offset]);
  return scrolled;
}

/** Index of the current page in NAV, matching the most specific route. */
function useNavIndex() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/app";
  const i = NAV.findIndex((n) => (n.end ? path === n.to : path === n.to || path.startsWith(`${n.to}/`)));
  return Math.max(0, i);
}

function Rail() {
  const i = useNavIndex();
  return (
    <div className="app-rail" aria-hidden="true">
      <span className="app-rail-n">
        {String(i + 1).padStart(2, "0")}
        <span>/{String(NAV.length).padStart(2, "0")}</span>
      </span>
      <span className="app-rail-line">
        <i style={{ transform: `scaleY(${(i + 1) / NAV.length})` }} />
      </span>
      <span className="app-rail-name" key={i}>
        {NAV[i].long}
      </span>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { open } = useAppKit();
  const w = useWallet();
  const data = useWalletData(w.address);
  const [menu, setMenu] = useState(false);
  const scrolled = useScrolled();
  const { pathname } = useLocation();
  const chain = chainMeta(w.chainId);

  // A new page starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);

  const credDot = w.isConnected ? (
    <span className={`app-dot${data.credential ? " on" : ""}`} aria-label={data.credential ? "Card issued" : "Card not issued"} />
  ) : null;

  return (
    <div className="dash">
      <header className={`app-nav${scrolled ? " is-scrolled" : ""}`}>
        <Link to="/" className="brand app-nav-brand" aria-label="CassaFi home">
          <Logo />
        </Link>

        <nav className="app-capsule" aria-label="App">
          {CAPSULE.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `app-capsule-link${isActive ? " active" : ""}`}>
              {n.label}
              {n.to === "/app/credential" ? credDot : null}
            </NavLink>
          ))}
        </nav>

        <div className="app-nav-actions">
          {w.isConnected ? (
            <>
              <button
                type="button"
                className={`net-pill${w.unsupported ? " net-pill--bad" : ""}`}
                onClick={() => open({ view: "Networks" })}
              >
                <span className="net-dot" />
                <span className="net-name">{w.unsupported ? "Unsupported" : chain.short}</span>
                <ChevronDown size={14} />
              </button>
              <button type="button" className="acct-btn" onClick={() => open({ view: "Account" })}>
                <span className="acct-avatar" aria-hidden="true" />
                <span className="mono">{shortAddr(w.address)}</span>
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-pri btn-sm" onClick={() => open()}>
              Connect
            </button>
          )}
          <NavLink to="/app/settings" className={({ isActive }) => `app-round${isActive ? " active" : ""}`} aria-label="Settings">
            <Settings size={17} />
          </NavLink>
          <button
            type="button"
            className="app-round app-burger"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <div className={`app-sheet${menu ? " is-open" : ""}`} aria-hidden={!menu}>
        <nav aria-label="Menu" onClick={(e) => (e.target as HTMLElement).closest("a") && setMenu(false)}>
          {NAV.map((n, i) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              tabIndex={menu ? 0 : -1}
              className={({ isActive }) => (isActive ? "active" : "")}
              style={{ "--d": `${i * 35}ms` } as React.CSSProperties}
            >
              <span className="app-sheet-n">{String(i + 1).padStart(2, "0")}</span>
              {n.long}
              {n.to === "/app/credential" ? credDot : null}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="btn btn-sec" tabIndex={menu ? 0 : -1} onClick={() => setMenu(false)}>
          Back to website <ArrowUpRight size={15} />
        </Link>
      </div>

      <main className="dash-content">{children}</main>

      <footer className="app-foot">
        <span>CassaFi app</span>
        <span>Robinhood Chain · Ethereum</span>
        <Link to="/">Back to website</Link>
      </footer>

      <Rail />
    </div>
  );
}
