import { useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { addressUrl, txUrl } from "../lib/chains";
import { shortAddr } from "../lib/format";

/* Shared dashboard building blocks. Everything here renders from the shared
   tokens and the website's type system (mono labels, sans headlines with an
   italic serif phrase), so the app and the site read as one product. */

export function PageHeader({ eyebrow, title, sub, actions }: { eyebrow: string; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <span className="app-label page-eyebrow">
          <span className="app-label-dot" />
          {eyebrow}
        </span>
        <h1>{title}</h1>
        {sub ? <p className="page-sub">{sub}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Card({
  title,
  label,
  action,
  children,
  className = "",
  id,
}: {
  title?: ReactNode;
  label?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={`card ${className}`} id={id}>
      {title || label || action ? (
        <div className="card-head">
          <div>
            {label ? <span className="card-label">{label}</span> : null}
            {title ? <h2 className="card-title">{title}</h2> : null}
          </div>
          {action ? <div className="card-action">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export type Tone = "ok" | "warn" | "bad" | "muted" | "info";

export function Badge({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={done ? "Copied" : label}
      title={done ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard blocked: nothing to do */
        }
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function AddressChip({ address, chainId, label }: { address: string; chainId: number; label?: string }) {
  return (
    <span className="addr">
      {label ? <span className="addr-label">{label}</span> : null}
      <span className="mono">{shortAddr(address)}</span>
      <CopyButton value={address} label="Copy address" />
      <a className="icon-btn" href={addressUrl(chainId, address)} target="_blank" rel="noopener noreferrer" aria-label="View on explorer">
        <ExternalLink size={14} />
      </a>
    </span>
  );
}

export function TxLink({ chainId, hash }: { chainId: number; hash: string }) {
  return (
    <a className="tx-link mono" href={txUrl(chainId, hash)} target="_blank" rel="noopener noreferrer">
      {shortAddr(hash, 8, 6)}
      <ExternalLink size={12} />
    </a>
  );
}

/** Token avatar: the explorer's icon when there is one, else initials on a tint derived from the address. */
export function TokenAvatar({ symbol, address, icon, size = 32 }: { symbol: string; address: string; icon?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const hue = parseInt(address.slice(2, 8) || "0", 16) % 5;
  if (icon && !broken) {
    return <img className="tok" src={icon} alt="" width={size} height={size} onError={() => setBroken(true)} />;
  }
  return (
    <span className={`tok tok--${hue}`} style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">
      {symbol.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "?"}
    </span>
  );
}

export function Meter({ value, max, tone }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const t = tone ?? (pct >= 100 ? "bad" : pct >= 80 ? "warn" : "ok");
  return (
    <div className={`meter meter--${t}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon ? <div className="empty-ico">{icon}</div> : null}
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ h = 16, w = "100%" }: { h?: number; w?: number | string }) {
  return <span className="skel" style={{ height: h, width: w }} />;
}

export function Notice({ tone = "info", children, action }: { tone?: Tone; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === "bad" ? "alert" : "status"}>
      <div>{children}</div>
      {action ? <div className="notice-action">{action}</div> : null}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return <Notice tone="bad">{(error as Error).message || "Something went wrong."}</Notice>;
}
