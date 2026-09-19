import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { useAppKit } from "@reown/appkit/react";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Eye,
  LayoutDashboard,
  ListOrdered,
  Menu,
  Send,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Logo } from "../../components/ui/Logo";
import { useWallet } from "../hooks/data";
import { chainMeta } from "../lib/chains";
import { shortAddr } from "../lib/format";
import { useWalletData } from "../lib/store";

const NAV: { group: string; items: { to: string; label: string; icon: ReactNode; end?: boolean }[] }[] = [
  {
    group: "Banking",
    items: [
      { to: "/app", label: "Overview", icon: <LayoutDashboard size={18} />, end: true },
      { to: "/app/pay", label: "Authorize payment", icon: <Send size={18} /> },
      { to: "/app/activity", label: "Activity", icon: <ListOrdered size={18} /> },
    ],
  },
  {
    group: "Privacy & control",
    items: [
      { to: "/app/credential", label: "Credential", icon: <BadgeCheck size={18} /> },
      { to: "/app/privacy", label: "Exposure report", icon: <Eye size={18} /> },
      { to: "/app/controls", label: "Spending controls", icon: <SlidersHorizontal size={18} /> },
    ],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const { open } = useAppKit();
  const w = useWallet();
  const data = useWalletData(w.address);
  const [drawer, setDrawer] = useState(false);
  // Any link click inside the drawer closes it (mobile navigation).
  const closeOnLink = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) setDrawer(false);
  };

  const chain = chainMeta(w.chainId);

  return (
    <div className={`dash${drawer ? " dash--drawer" : ""}`}>
      <aside className="dash-side" aria-label="Dashboard" onClick={closeOnLink}>
        <div className="side-top">
          <Link to="/" className="brand" aria-label="PrivaBank home">
            <Logo />
          </Link>
          <button type="button" className="icon-btn side-close" aria-label="Close menu" onClick={() => setDrawer(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="side-nav">
          {NAV.map((g) => (
            <div className="side-group" key={g.group}>
              <span className="side-group-label">{g.group}</span>
              {g.items.map((it) => (
                <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `side-link${isActive ? " active" : ""}`}>
                  {it.icon}
                  <span>{it.label}</span>
                  {it.to === "/app/credential" && w.isConnected ? (
                    <span className={`side-dot${data.credential ? " on" : ""}`} aria-label={data.credential ? "Issued" : "Not issued"} />
                  ) : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="side-bottom">
          <NavLink to="/app/settings" className={({ isActive }) => `side-link${isActive ? " active" : ""}`}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
          <Link to="/" className="side-link">
            <ArrowLeft size={18} />
            <span>Back to website</span>
          </Link>
        </div>
      </aside>

      <div className="dash-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />

      <div className="dash-main">
        <header className="dash-top">
          <button type="button" className="icon-btn dash-burger" aria-label="Open menu" onClick={() => setDrawer(true)}>
            <Menu size={20} />
          </button>
          <Link to="/app" className="brand dash-top-brand" aria-label="PrivaBank dashboard">
            <Logo />
          </Link>

          <div className="dash-top-right">
            {w.isConnected ? (
              <>
                <button
                  type="button"
                  className={`net-pill${w.unsupported ? " net-pill--bad" : ""}`}
                  onClick={() => open({ view: "Networks" })}
                >
                  <span className="net-dot" />
                  {w.unsupported ? "Unsupported network" : chain.short}
                  {chain.testnet && !w.unsupported ? <span className="net-test">test</span> : null}
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
          </div>
        </header>

        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}
