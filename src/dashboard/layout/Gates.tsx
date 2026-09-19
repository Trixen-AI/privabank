import { Link } from "react-router";
import { ArrowLeft, BadgeCheck, KeyRound, Send } from "lucide-react";
import { Logo } from "../../components/ui/Logo";

/* Screens shown before the dashboard proper: missing configuration, and the
   connect step. Same panel, type and palette as the website hero. */

function GateFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="gate">
      <header className="gate-top">
        <Link to="/" className="brand" aria-label="PrivaBank home">
          <Logo />
        </Link>
        <Link to="/" className="gate-back">
          <ArrowLeft size={16} /> Back to website
        </Link>
      </header>
      <main className="gate-main">{children}</main>
    </div>
  );
}

const STEPS = [
  { icon: <KeyRound size={18} />, title: "Sign in", body: "Use Google, email, or any wallet. No seed phrase to manage with social login." },
  { icon: <BadgeCheck size={18} />, title: "Issue a credential", body: "One signature derives your spending credential. It never moves funds." },
  { icon: <Send size={18} />, title: "Authorize payments", body: "Pay by proving permission, inside the limits you set." },
];

export function ConnectGate({ onConnect, connecting }: { onConnect: () => void; connecting: boolean }) {
  return (
    <GateFrame>
      <section className="panel panel--accent gate-panel">
        <div className="panel__dots" />
        <div className="panel__glow" />
        <div className="panel__inner gate-inner">
          <span className="ds-label">PrivaBank app</span>
          <h1>
            Open your <span className="hl">private account.</span>
          </h1>
          <p className="gate-sub">
            Connect to issue your credential, set spending rules, and authorize payments on Robinhood Chain and Ethereum.
          </p>
          <div className="gate-cta">
            <button type="button" className="btn btn-pri" onClick={onConnect} disabled={connecting}>
              {connecting ? "Connecting…" : "Sign in or connect wallet"}
            </button>
          </div>
        </div>
      </section>

      <ol className="gate-steps">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="gate-step-ico">{s.icon}</span>
            <span className="ds-label">Step {i + 1}</span>
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
        <span className="ds-label page-eyebrow">Setup required</span>
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
