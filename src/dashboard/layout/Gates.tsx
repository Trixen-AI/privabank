import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "../../components/ui/Logo";

/* Screens shown before the dashboard proper: missing configuration, and the
   connect step. Same composition as the website hero: mono label, a sans line
   with an italic serif phrase, one jade action, numbered steps below. */

function GateFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="gate">
      <div className="gate-glow" aria-hidden="true" />
      <header className="gate-top">
        <Link to="/" className="brand" aria-label="CassaFi home">
          <Logo />
        </Link>
        <Link to="/" className="btn btn-sec btn-sm">
          Back to website
        </Link>
      </header>
      <main className="gate-main">{children}</main>
    </div>
  );
}

const STEPS = [
  { title: "Sign in", body: "Use Google, email or any wallet. Social login means there's no seed phrase to look after." },
  { title: "Get your card", body: "Add your name and sign once. That signature creates your spending credential and never moves funds." },
  { title: "Pay by permission", body: "Authorize payments inside the limits you set, on Robinhood Chain or Ethereum." },
];

export function ConnectGate({ onConnect, connecting }: { onConnect: () => void; connecting: boolean }) {
  return (
    <GateFrame>
      <section className="gate-hero">
        <span className="app-label">
          <span className="app-label-dot" />
          CassaFi app
        </span>
        <h1>
          Open your account,
          <em>off the record.</em>
        </h1>
        <p className="gate-sub">Connect to get your card, set your spending rules and authorize payments without putting your balance on show.</p>
        <div className="gate-cta">
          <button type="button" className="btn btn-pri" onClick={onConnect} disabled={connecting}>
            {connecting ? "Connecting…" : "Sign in or connect wallet"} <ArrowUpRight size={15} />
          </button>
          <span className="gate-nets">Robinhood Chain · Ethereum</span>
        </div>
      </section>

      <ol className="gate-steps">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="gate-step-n">{String(i + 1).padStart(2, "0")}</span>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
    </GateFrame>
  );
}

export function SetupRequired() {
  return (
    <GateFrame>
      <section className="card setup-card">
        <span className="app-label">
          <span className="app-label-dot" />
          Setup required
        </span>
        <h1>Wallet connection isn't configured yet</h1>
        <p>
          The dashboard signs users in through Reown AppKit, which needs a project ID. Create a free project at{" "}
          <a href="https://dashboard.reown.com" target="_blank" rel="noopener noreferrer">
            dashboard.reown.com
          </a>
          , then add it to a <code>.env</code> file in the project root:
        </p>
        <pre className="code-block">VITE_REOWN_PROJECT_ID=your_project_id</pre>
        <p>
          Restart the dev server after saving. Add your site's origin (for local work, <code>http://localhost:5173</code>) to the
          project's allowed domains in the Reown dashboard.
        </p>
      </section>
    </GateFrame>
  );
}
